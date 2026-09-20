import assert from "node:assert/strict";

import { test } from "node:test";

import { ConversationMemory } from "../src/lib/chat/conversation-memory.server.ts";

import { createChatServices } from "../src/lib/chat/chat-services.server.ts";

import { CONVERSATION_INACTIVITY_TIMEOUT_MS } from "../src/lib/chat/conversation-sessions.server.ts";

import { ModelRequestLimiter } from "../src/lib/chat/model-request-limiter.server.ts";

import { ChatHandler } from "../src/lib/chat/chat-handler.server.ts";

import { handleChatRequest } from "../src/lib/chat/chat-http.server.ts";

import { CHAT_INSTRUCTIONS } from "../src/lib/chat/chat-instructions.server.ts";

import { validateChatInput, readChatInput } from "../src/lib/chat/chat-validator.server.ts";

/** Creates a same-origin request without accessing the real network. */
function chatRequest(body, cookie = "", method = "POST") {
    const headers = {
        "Content-Type": "application/json",

        Origin: "https://influential.test",

        Cookie: cookie,
    };

    const options = { method, headers };

    if (method === "POST") {
        options.body = JSON.stringify(body);
    }

    return new Request("https://influential.test/api/chat", options);
}

/** Returns deterministic text without calling a provider or spending tokens. */
async function fakeReply() {
    return "Tell me about your video project.";
}

/** Extracts the session cookie for the next simulated browser request. */
function sessionCookie(response) {
    return response.headers.get("set-cookie").split(";")[0];
}

/** Checks input normalization, role injection rejection and preservation of legitimate text. */
test("validator accepts plain text and rejects invalid input before model use", () => {
    assert.deepEqual(validateChatInput({ message: "  What's <new>?\nHello!  " }), {
        message: "What's <new>?\nHello!",
    });

    const invalidInputs = [
        null,
        {},
        { message: 123 },
        { message: "   " },
        { message: "x".repeat(2001) },
        { message: "Hello", role: "system" },
        { message: "Hello", conversationId: "other" },
        { message: "Hello\u0000" },
    ];

    for (const input of invalidInputs) {
        assert.throws(() => validateChatInput(input), { code: "INVALID_MESSAGE" });
    }
});

/** Checks the body limit independently of a claimed Content-Length header. */
test("HTTP parsing rejects oversized bodies, invalid JSON and unsupported content types", async () => {
    const oversized = chatRequest({ message: "x".repeat(17000) });

    oversized.headers.set("content-length", "1");

    await assert.rejects(readChatInput(oversized), { status: 413 });

    const invalidJson = new Request("https://influential.test/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
    });

    await assert.rejects(readChatInput(invalidJson), { code: "INVALID_JSON" });

    const wrongType = chatRequest({ message: "hello" });

    wrongType.headers.set("content-type", "text/plain");

    await assert.rejects(readChatInput(wrongType), { status: 415 });
});

/** Checks two isolated histories and trusted instructions prepended once on every turn. */
test("handlers share a store but never mix conversations", async () => {
    const services = createChatServices();

    const memory = services.memory;

    const firstId = memory.createConversation();

    const secondId = memory.createConversation();

    const contexts = [];

    /** Records the prepared context and returns a simulated answer. */
    async function captureReply(messages) {
        contexts.push(structuredClone(messages));

        return "Answer " + contexts.length;
    }

    await createHandler(services, captureReply).handle(firstId, "First project");

    await createHandler(services, captureReply).handle(secondId, "Second project");

    await createHandler(services, captureReply).handle(firstId, "Follow up");

    assert.deepEqual(
        contexts[2].map((message) => message.role),
        ["system", "user", "assistant", "user"],
    );

    assert.equal(contexts[2][0].content, CHAT_INSTRUCTIONS);

    assert.equal(contexts[2][1].content, "First project");

    assert.equal(contexts[1].length, 2);

    assert.equal(memory.getMessages(firstId).length, 4);

    assert.equal(memory.getMessages(secondId).length, 2);

    const copy = memory.getMessages(firstId);

    copy[0].content = "Modified outside store";

    assert.equal(memory.getMessages(firstId)[0].content, "First project");
});

/** Confirms a failed model call leaves no partial exchange and releases the session lock. */
test("provider failure preserves history and allows retry", async () => {
    const services = createChatServices();

    const memory = services.memory;

    const id = memory.createConversation();

    /** Simulates a provider failure, without making a network call. */
    async function failReply() {
        throw new Error("private-provider-error");
    }

    await assert.rejects(createHandler(services, failReply).handle(id, "Hello"));

    assert.deepEqual(memory.getMessages(id), []);

    await createHandler(services, fakeReply).handle(id, "Hello");

    assert.equal(memory.getMessages(id).length, 2);
});

/** Exercises overlap and closing a session while the model is still replying. */
test("simultaneous messages conflict and a late reply cannot recreate deleted history", async () => {
    const services = createChatServices();

    const memory = services.memory;

    const id = memory.createConversation();

    let resolveReply;

    const pendingReply = new Promise((resolve) => {
        resolveReply = resolve;
    });

    /** Holds the model reply until the test explicitly releases it. */
    async function delayedReply() {
        return pendingReply;
    }

    const first = createHandler(services, delayedReply).handle(id, "First");

    await assert.rejects(createHandler(services, fakeReply).handle(id, "Second"), {
        code: "CHAT_BUSY",
    });

    memory.deleteConversation(id);

    resolveReply("Late answer");

    await assert.rejects(first, { code: "SESSION_EXPIRED" });

    assert.throws(() => memory.getMessages(id), { status: 410 });
});

/** Checks that expiry/capacity belong to session policy, not the message collection. */
test("sessions enforce expiry and capacity while memory remains ordinary storage", () => {
    let currentTime = 1000;

    const services = createChatServices(() => currentTime);

    const id = services.sessions.openConversation();

    currentTime = currentTime + CONVERSATION_INACTIVITY_TIMEOUT_MS;

    // Storage itself does not expire data when it is read.
    assert.deepEqual(services.memory.getMessages(id), []);

    assert.throws(() => services.sessions.requireActiveConversation(id), {
        code: "SESSION_EXPIRED",
    });

    assert.throws(() => services.memory.getMessages(id), { code: "SESSION_EXPIRED" });

    for (let count = 0; count < 100; count++) {
        services.sessions.openConversation();
    }

    assert.throws(() => services.sessions.openConversation(), { code: "CHAT_CAPACITY" });

    const unrestrictedMemory = new ConversationMemory();

    for (let count = 0; count < 101; count++) {
        unrestrictedMemory.createConversation();
    }

    assert.equal(unrestrictedMemory.getConversationCount(), 101);
});

/** Checks the exact one-minute boundary and proves rejected calls never extend the usage history. */
test("limiter counts started model calls per conversation and across the process", () => {
    let currentTime = 1000;

    const limiter = new ModelRequestLimiter(() => currentTime);

    for (let count = 0; count < 10; count++) {
        limiter.checkAndRecordModelCall("first");
    }

    currentTime = 2000;

    assert.throws(() => limiter.checkAndRecordModelCall("first"), { status: 429 });

    for (let count = 0; count < 20; count++) {
        limiter.checkAndRecordModelCall("other-" + count);
    }

    assert.throws(() => limiter.checkAndRecordModelCall("another"), { status: 429 });

    currentTime = 61000;

    // Exactly ten earlier calls have expired. The rejected call at 2000 was not recorded.
    for (let count = 0; count < 10; count++) {
        limiter.checkAndRecordModelCall("first");
    }

    assert.throws(() => limiter.checkAndRecordModelCall("extra"), { status: 429 });
});

/** Checks history limits before the connector receives an oversized model context. */
test("handler refuses an over-budget context without calling the model", async () => {
    const services = createChatServices();

    const memory = services.memory;

    const id = memory.createConversation();

    for (let count = 0; count < 10; count++) {
        memory.addMessage(id, { role: "user", content: "Question" });

        memory.addMessage(id, { role: "assistant", content: "Answer" });
    }

    /** Fails the test if budget enforcement allows a model call. */
    async function mustNotCall() {
        assert.fail("The model must not be called");
    }

    await assert.rejects(createHandler(services, mustNotCall).handle(id, "Next"), {
        code: "CHAT_LIMIT",
    });

    const longId = memory.createConversation();

    memory.addMessage(longId, { role: "user", content: "Question" });

    memory.addMessage(longId, { role: "assistant", content: "x".repeat(15000) });

    await assert.rejects(createHandler(services, mustNotCall).handle(longId, "Next"), {
        code: "CHAT_LIMIT",
    });
});

/** Verifies the HTTP contract, private cookie, persistence across requests and explicit close. */
test("HTTP creates, continues and deletes one conversation per cookie", async () => {
    const services = createChatServices();

    const memory = services.memory;

    const first = await handleChatRequest(
        chatRequest({ message: "  Hello  " }),
        services,
        fakeReply,
    );

    assert.equal(first.status, 200);

    assert.match(first.headers.get("set-cookie"), /HttpOnly; SameSite=Strict; Secure/);

    assert.equal(first.headers.get("cache-control"), "no-store");

    const cookie = sessionCookie(first);

    const id = cookie.split("=")[1];

    assert.equal(memory.getMessages(id)[0].content, "Hello");

    const second = await handleChatRequest(
        chatRequest({ message: "Follow up" }, cookie),
        services,
        fakeReply,
    );

    assert.equal(second.status, 200);

    assert.equal(memory.getMessages(id).length, 4);

    const closed = await handleChatRequest(
        chatRequest(null, cookie, "DELETE"),
        services,
        fakeReply,
    );

    assert.equal(closed.status, 204);

    assert.match(closed.headers.get("set-cookie"), /Max-Age=0/);

    const stale = await handleChatRequest(
        chatRequest({ message: "Hello" }, cookie),
        services,
        fakeReply,
    );

    assert.equal(stale.status, 410);

    assert.match(stale.headers.get("set-cookie"), /Max-Age=0/);
});

/** Checks validation precedes model calls and HTTP errors never expose provider secrets. */
test("HTTP rejects foreign origins and invalid input, and hides provider details", async () => {
    const services = createChatServices();

    const memory = services.memory;

    let calls = 0;

    /** Counts calls and simulates sensitive details in a provider error. */
    async function failReply() {
        calls = calls + 1;

        throw new Error("private-provider-key");
    }

    const foreign = chatRequest({ message: "Hello" });

    foreign.headers.set("origin", "https://other.test");

    assert.equal((await handleChatRequest(foreign, services, failReply)).status, 403);

    assert.equal(
        (await handleChatRequest(chatRequest({ message: " " }), services, failReply)).status,
        400,
    );

    assert.equal(calls, 0);

    const response = await handleChatRequest(
        chatRequest({ message: "Hello" }),
        services,
        failReply,
    );

    assert.equal(response.status, 502);

    assert.doesNotMatch(await response.text(), /private-provider-key/);

    const cookie = sessionCookie(response);

    assert.deepEqual(memory.getMessages(cookie.split("=")[1]), []);
});

/** Constructs a request handler with shared dependencies, just as the HTTP entry does. */
function createHandler(services, generateReply) {
    return new ChatHandler(
        services.memory,
        generateReply,
        services.requestCoordinator,
        services.modelRequestLimiter,
    );
}

/** A slow reply for one visitor must not block a different visitor's model call. */
test("different conversations can wait for model responses independently", async () => {
    const services = createChatServices();

    const firstId = services.memory.createConversation();

    const secondId = services.memory.createConversation();

    let finishFirst;

    const pending = new Promise((resolve) => {
        finishFirst = resolve;
    });

    const first = createHandler(services, async () => pending).handle(firstId, "First");

    const second = await createHandler(services, fakeReply).handle(secondId, "Second");

    assert.equal(second, "Tell me about your video project.");

    assert.deepEqual(services.memory.getMessages(firstId), []);

    finishFirst("First answer");

    await first;
});

/** Failures still use model-call allowance; successful completion is not what this limiter counts. */
test("failed model calls count but rate-limit rejections never call the model", async () => {
    const services = createChatServices();

    const id = services.memory.createConversation();

    let modelCalls = 0;

    /** Simulates a model-client failure after the handler has admitted the call. */
    async function failReply() {
        modelCalls = modelCalls + 1;

        throw new Error("provider failed");
    }

    const handler = createHandler(services, failReply);

    for (let count = 0; count < 10; count++) {
        await assert.rejects(handler.handle(id, "Hello"), /provider failed/);
    }

    await assert.rejects(handler.handle(id, "Hello"), { code: "CHAT_RATE_LIMIT" });

    assert.equal(modelCalls, 10);

    assert.deepEqual(services.memory.getMessages(id), []);
});

/** Invalid histories are rejected before reserving any model-call allowance. */
test("context validation failures do not consume the process model-call limit", async () => {
    const services = createChatServices();

    const invalidId = services.memory.createConversation();

    services.memory.addMessage(invalidId, { role: "assistant", content: "x".repeat(16000) });

    const handler = createHandler(services, fakeReply);

    for (let count = 0; count < 31; count++) {
        await assert.rejects(handler.handle(invalidId, "Next"), { code: "CHAT_LIMIT" });
    }

    for (let count = 0; count < 30; count++) {
        await handler.handle(services.memory.createConversation(), "Hello");
    }

    await assert.rejects(handler.handle(services.memory.createConversation(), "Hello"), {
        code: "CHAT_RATE_LIMIT",
    });
});
