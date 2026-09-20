import assert from "node:assert/strict";
import { test } from "node:test";

import { handleChatRequest } from "../src/lib/chat/chat-http.server.ts";
import { CHAT_INSTRUCTIONS } from "../src/lib/chat/chat-instructions.server.ts";
import { validateChatInput } from "../src/lib/chat/chat-validator.server.ts";
import { ConversationMemory } from "../src/lib/chat/conversation-manager/conversation-memory.server.ts";
import { ConversationSessions, CONVERSATION_INACTIVITY_TIMEOUT_MS } from "../src/lib/chat/conversation-manager/conversation-sessions.server.ts";
import { ModelRequestLimiter } from "../src/lib/chat/conversation-manager/model-request-limiter.server.ts";
import { closeConversation } from "../src/lib/chat/handlers/close-conversation.server.ts";
import { requestResponse } from "../src/lib/chat/handlers/request-response.server.ts";
import { readChatSettings } from "../src/lib/chat/chat-settings.server.ts";
import { readChatSocketEvent, validateChatSocketOrigin } from "../src/lib/chat/websocket-transport/chat-socket-validator.server.ts";

test("instructions name the agency, studio, contact form, and refuse off-topic use", () => {
    assert.match(CHAT_INSTRUCTIONS, /INFLUENTIAL LABS/);
    assert.match(CHAT_INSTRUCTIONS, /video\.influentiallabs\.studio/);
    assert.match(CHAT_INSTRUCTIONS, /\/start/);
    assert.match(CHAT_INSTRUCTIONS, /AI Avatar Generator/);
    assert.match(CHAT_INSTRUCTIONS, /Video Agent/);
    assert.match(CHAT_INSTRUCTIONS, /AI Studio/);
    assert.match(CHAT_INSTRUCTIONS, /Video Translation/);
    assert.match(CHAT_INSTRUCTIONS, /not a general-purpose/);
    assert.match(CHAT_INSTRUCTIONS, /jailbreak/i);
    assert.doesNotMatch(CHAT_INSTRUCTIONS, /Intelligent Labs/);
});

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

test("HTTP chat route requires the WebSocket endpoint", async () => {
    const response = handleChatRequest();
    assert.equal(response.status, 426);
    assert.equal(response.headers.get("upgrade"), "websocket");
    const body = await response.json();
    assert.equal(body.error.code, "WEBSOCKET_REQUIRED");
});

test("socket events accept a message and reject extra fields or bad JSON", () => {
    assert.equal(readChatSocketEvent(JSON.stringify({ type: "message", message: "  Hi  " })).message, "Hi");

    assert.throws(() => readChatSocketEvent("{"), { code: "INVALID_JSON" });
    assert.throws(
        () => readChatSocketEvent(JSON.stringify({ type: "message", message: "Hi", role: "system" })),
        { code: "INVALID_EVENT" },
    );
});

test("socket origin must match the request URL", () => {
    const ok = new Request("https://influential.test/api/chat/socket", {
        headers: { origin: "https://influential.test" },
    });
    validateChatSocketOrigin(ok);

    const foreign = new Request("https://influential.test/api/chat/socket", {
        headers: { origin: "https://other.test" },
    });
    assert.throws(() => validateChatSocketOrigin(foreign));
});

test("sessions enforce expiry and capacity while memory remains ordinary storage", () => {
    let currentTime = 1000;
    const memory = new ConversationMemory();
    const sessions = new ConversationSessions(memory, () => currentTime);

    const id = sessions.openConversation();
    currentTime = currentTime + CONVERSATION_INACTIVITY_TIMEOUT_MS;

    assert.deepEqual(memory.getMessages(id), []);
    assert.throws(() => sessions.requireActiveConversation(id), { code: "SESSION_EXPIRED" });
    assert.throws(() => memory.getMessages(id), { code: "SESSION_EXPIRED" });

    for (let count = 0; count < 100; count++) {
        sessions.openConversation();
    }
    assert.throws(() => sessions.openConversation(), { code: "CHAT_CAPACITY" });

    const unrestrictedMemory = new ConversationMemory();
    for (let count = 0; count < 101; count++) {
        unrestrictedMemory.createConversation();
    }
    assert.equal(unrestrictedMemory.getConversationCount(), 101);
});

test("memory keeps conversations isolated and copies history", () => {
    const memory = new ConversationMemory();
    const firstId = memory.createConversation();
    const secondId = memory.createConversation();

    memory.addMessage(firstId, { role: "user", content: "First project" });
    memory.addMessage(firstId, { role: "assistant", content: "Answer 1" });
    memory.addMessage(secondId, { role: "user", content: "Second project" });

    assert.equal(memory.getMessages(firstId).length, 2);
    assert.equal(memory.getMessages(secondId).length, 1);

    const copy = memory.getMessages(firstId);
    copy[0].content = "Modified outside store";
    assert.equal(memory.getMessages(firstId)[0].content, "First project");
});

test("limiter counts started model calls per conversation and across the process", () => {
    const settings = readChatSettings();
    let currentTime = 1000;
    const limiter = new ModelRequestLimiter(() => currentTime);
    const perConversation = settings.maxModelCallsPerConversationPerMinute;
    const perProcess = settings.maxModelCallsPerProcessPerMinute;

    for (let count = 0; count < perConversation; count++) {
        limiter.checkAndRecordModelCall("first");
    }
    currentTime = 2000;
    assert.throws(() => limiter.checkAndRecordModelCall("first"), { status: 429 });

    const remainingProcess = perProcess - perConversation;
    for (let count = 0; count < remainingProcess; count++) {
        limiter.checkAndRecordModelCall("other-" + count);
    }
    assert.throws(() => limiter.checkAndRecordModelCall("another"), { status: 429 });

    currentTime = 61000;
    for (let count = 0; count < perConversation; count++) {
        limiter.checkAndRecordModelCall("first");
    }
    assert.throws(() => limiter.checkAndRecordModelCall("extra"), { status: 429 });
});

test("close handler is a no-op without an id", () => {
    closeConversation(undefined);
});

test("request-response reports manager errors through ChatOutput", () => {
    const events = [];
    const output = {
        sendResponse() {},
        sendError(failure) {
            events.push(failure);
        },
        sendEvent(event) {
            events.push(event);
            return true;
        },
        closeConnection() {},
    };

    requestResponse("missing-id", "Hello", output);
    assert.equal(events.length, 1);
    assert.equal(events[0].code, "SESSION_EXPIRED");
});
