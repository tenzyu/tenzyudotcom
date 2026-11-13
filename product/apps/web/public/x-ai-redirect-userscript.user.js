// ==UserScript==
// @name         X AI Consult Redirector
// @namespace    npm/vite-plugin-monkey
// @version      1.0.0
// @author       tenzyu
// @description  メンタルが落ち込んでいるときにXへの投稿を思いとどまらせ、AIへの相談を促すスクリプト
// @match        https://x.com/*
// @match        https://twitter.com/*
// @match        https://aistudio.google.com/*
// @match        https://gemini.google.com/*
// @match        https://chatgpt.com/*
// @match        https://claude.ai/*
// ==/UserScript==

(function () {
  'use strict';

  const AI_CHAT_URL = "https://aistudio.google.com/app/prompts/new_chat";
  function handleX() {
    function processTweet(e, textElement) {
      let text = "";
      if (textElement) {
        text = textElement.innerText || "";
      }
      if (text.trim() === "") return;
      const redirect = window.confirm(
        "メンタルが落ち込んでいませんか？\n投稿する前に、AIに相談してみましょう。\n（OKを押すとテキストが自動的にペーストされる状態でAIチャットが開きます）"
      );
      if (redirect) {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(text).catch(() => {
        });
        const targetUrl = new URL(AI_CHAT_URL);
        targetUrl.hash = `x-ai-prompt=${encodeURIComponent(text)}`;
        window.open(targetUrl.toString(), "_blank");
      }
    }
    const observer = new MutationObserver((mutations) => {
      for (const _mutation of mutations) {
        const postButtons = document.querySelectorAll(
          '[data-testid="tweetButtonInline"], [data-testid="tweetButton"]'
        );
        postButtons.forEach((button) => {
          if (!button.hasAttribute("data-ai-redirect-injected")) {
            button.setAttribute("data-ai-redirect-injected", "true");
            button.addEventListener("click", (e) => {
              const textElement = document.querySelector('[data-testid="tweetTextarea_0"]');
              processTweet(e, textElement);
            }, { capture: true });
          }
        });
        const textareas = document.querySelectorAll('[data-testid="tweetTextarea_0"]');
        textareas.forEach((textarea) => {
          if (!textarea.hasAttribute("data-ai-redirect-injected-key")) {
            textarea.setAttribute("data-ai-redirect-injected-key", "true");
            textarea.addEventListener("keydown", (e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                processTweet(e, textarea);
              }
            }, { capture: true });
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  function handleAI() {
    const hash = window.location.hash;
    const match = hash.match(/#x-ai-prompt=(.*)/);
    if (!match) return;
    const promptText = decodeURIComponent(match[1]);
    if (!promptText) return;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    const url2 = window.location.href;
    const insertText = (selector) => {
      const selectors = Array.isArray(selector) ? selector : [selector];
      let attempts = 0;
      const maxAttempts = 20;
      const checkExist = setInterval(() => {
        attempts++;
        let el = null;
        for (const sel of selectors) {
          el = document.querySelector(sel);
          if (el) break;
        }
        if (el || attempts >= maxAttempts) {
          clearInterval(checkExist);
          if (el) {
            if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
              el.value = promptText;
              el.dispatchEvent(new Event("input", { bubbles: true }));
            } else if (el.isContentEditable) {
              el.focus();
              if (!document.execCommand("insertText", false, promptText)) {
                el.innerText = promptText;
              }
              el.dispatchEvent(new Event("input", { bubbles: true }));
            }
          }
        }
      }, 500);
    };
    if (url2.includes("aistudio.google.com") || url2.includes("gemini.google.com")) {
      insertText(["rich-textarea", 'textarea[aria-label="Prompt text"]', "textarea", '[contenteditable="true"]']);
    } else if (url2.includes("chatgpt.com") || url2.includes("chat.openai.com")) {
      insertText("#prompt-textarea");
    } else if (url2.includes("claude.ai")) {
      insertText(".ProseMirror");
    } else {
      insertText(["textarea", '[contenteditable="true"]']);
    }
  }
  const url = window.location.href;
  if (url.includes("x.com") || url.includes("twitter.com")) {
    handleX();
  } else {
    handleAI();
  }

})();