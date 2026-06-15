import React, { useState, useRef, useEffect } from 'react';
import {
  SUGGESTED_QUESTIONS,
  findRelevantSections,
  normalizeQuery,
  getPackageByQuery,
  formatPackageDetails,
  isAskingForPackageList,
  getPackagesListResponse,
  getReferralFullResponse,
  getPersuasiveFallback,
  DEPOSIT_CTA
} from '../../data/chatbotKnowledge';
import logo from '../../assets/liberty_path_logo.png';
import { useWhatsApp } from '../../contexts/WhatsAppContext';

const ENV_WHATSAPP_FALLBACK = process.env.REACT_APP_WHATSAPP_GROUP_URL || '';

const LEARNED_STORAGE_KEY = 'libertypath_chatbot_learned';
const SESSIONS_STORAGE_KEY = 'libertypath_chatbot_sessions';
const CURRENT_CHAT_KEY = 'libertypath_chatbot_current';
const MAX_SESSIONS = 50;

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function loadCurrentChat() {
  try {
    const raw = localStorage.getItem(CURRENT_CHAT_KEY);
    if (!raw) return { messages: [], currentSessionId: null };
    const data = JSON.parse(raw);
    return {
      messages: Array.isArray(data.messages) ? data.messages : [],
      currentSessionId: data.currentSessionId || null
    };
  } catch {
    return { messages: [], currentSessionId: null };
  }
}

function saveCurrentChat(messages, currentSessionId) {
  try {
    localStorage.setItem(
      CURRENT_CHAT_KEY,
      JSON.stringify({ messages: messages || [], currentSessionId: currentSessionId || null })
    );
  } catch (_) {}
}

function loadSessions() {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.slice(0, MAX_SESSIONS) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  } catch (_) {}
}

function loadLearnedAnswers() {
  try {
    const raw = localStorage.getItem(LEARNED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLearnedAnswer(question, answer) {
  const learned = loadLearnedAnswers();
  const key = question.toLowerCase().trim().replace(/\s+/g, ' ').slice(0, 100);
  if (!key) return;
  learned[key] = answer;
  try {
    localStorage.setItem(LEARNED_STORAGE_KEY, JSON.stringify(learned));
  } catch (_) {}
}

function getLearnedAnswer(question) {
  const learned = loadLearnedAnswers();
  const key = question.toLowerCase().trim().replace(/\s+/g, ' ').slice(0, 100);
  return learned[key] || null;
}

function formatMessageText(text) {
  if (!text) return null;
  const byBold = text.split(/(\*\*[^*]+\*\*)/g);
  const result = [];
  let key = 0;
  byBold.forEach((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      result.push(<strong key={key++}>{part.slice(2, -2)}</strong>);
      return;
    }
    const byUrl = part.split(URL_REGEX);
    byUrl.forEach((segment) => {
      if (segment && /^https?:\/\//i.test(segment)) {
        result.push(
          <a
            key={key++}
            href={segment}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline break-all"
          >
            {segment}
          </a>
        );
      } else {
        result.push(segment);
      }
    });
  });
  return result;
}

function getBotResponse(userMessage, whatsappUrl) {
  const raw = (userMessage || '').trim();
  if (!raw) return null;

  const contactUrl = whatsappUrl || ENV_WHATSAPP_FALLBACK;

  const { corrected, wasCorrected } = normalizeQuery(raw);
  const correctionNote = wasCorrected
    ? `I interpreted your question as: "${corrected}". Here’s the answer:\n\n`
    : '';

  // WhatsApp link
  if (/\b(whatsapp|whats app|whatsapp link|join group|contact link)\b/i.test(corrected)) {
    return {
      type: 'whatsapp',
      text: (correctionNote || '') + `You can join our official WhatsApp group here: ${contactUrl}\n\nOpen the link to join for announcements, support, and community updates.`,
      link: contactUrl
    };
  }

  // Logo
  if (/\b(logo|show logo|platform logo|brand logo|image of logo)\b/i.test(corrected)) {
    return {
      type: 'logo',
      text: (correctionNote || '') + 'Here is the LibertyPath platform logo:'
    };
  }

  // Package list (all packages)
  if (isAskingForPackageList(corrected)) {
    return { type: 'text', text: (correctionNote || '') + getPackagesListResponse() };
  }

  // Specific package details
  const pkg = getPackageByQuery(corrected);
  if (pkg) {
    const details = formatPackageDetails(pkg) + DEPOSIT_CTA;
    return { type: 'text', text: (correctionNote || '') + details };
  }

  // Referral: always return full referral system details
  if (/\b(referral|referrals|refer|invite|commission|refferal|referal)\b/i.test(corrected)) {
    return { type: 'text', text: (correctionNote || '') + getReferralFullResponse() };
  }

  // Check learned answers (use corrected for lookup too)
  const learned = getLearnedAnswer(raw) || getLearnedAnswer(corrected);
  if (learned) return { type: 'text', text: (correctionNote || '') + learned };

  // Knowledge base (use corrected message for better matching)
  const sections = findRelevantSections(corrected);
  if (sections.length > 0) {
    const text = sections.map(s => `**${s.title}**\n\n${s.content}`).join('\n\n---\n\n');
    return { type: 'text', text: (correctionNote || '') + text };
  }

  return null;
}

function makeSessionTitle(messages) {
  const firstUser = messages.find((m) => m.role === 'user');
  if (firstUser && firstUser.content) {
    const s = firstUser.content.trim().slice(0, 40);
    return s + (firstUser.content.length > 40 ? '…' : '');
  }
  return 'New chat';
}

function Chatbot() {
  const { chatUrl } = useWhatsApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => loadCurrentChat().messages);
  const [currentSessionId, setCurrentSessionId] = useState(() => loadCurrentChat().currentSessionId);
  const [sessions, setSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  useEffect(() => {
    saveCurrentChat(messages, currentSessionId);
  }, [messages, currentSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startNewChat = () => {
    if (messages.length > 0) {
      const id = currentSessionId || `s-${Date.now()}`;
      const title = makeSessionTitle(messages);
      const session = { id, createdAt: Date.now(), messages: [...messages], title };
      setSessions((prev) => {
        const next = [session, ...prev.filter((s) => s.id !== id)].slice(0, MAX_SESSIONS);
        saveSessions(next);
        return next;
      });
    }
    setMessages([]);
    setCurrentSessionId(null);
    setShowHistory(false);
    saveCurrentChat([], null);
  };

  const loadSession = (session) => {
    setMessages(session.messages || []);
    setCurrentSessionId(session.id);
    setShowHistory(false);
  };

  const sendMessage = (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setLoading(true);

    setTimeout(() => {
      const { corrected, wasCorrected } = normalizeQuery(trimmed);
      const response = getBotResponse(trimmed, chatUrl);

      if (response) {
        if (response.type === 'text' && response.text) {
          saveLearnedAnswer(trimmed, response.text);
        }
        setMessages((prev) => {
          const next = [
            ...prev,
            { role: 'assistant', content: response.text, responseType: response.type, link: response.link }
          ];
          const sid = currentSessionId || `s-${Date.now()}`;
          setSessions((sess) => {
            const updated = sess.find((s) => s.id === sid)
              ? sess.map((s) => (s.id === sid ? { ...s, messages: next, title: makeSessionTitle(next) } : s))
              : [{ id: sid, createdAt: Date.now(), messages: next, title: makeSessionTitle(next) }, ...sess];
            saveSessions(updated.slice(0, MAX_SESSIONS));
            return updated.slice(0, MAX_SESSIONS);
          });
          setCurrentSessionId(sid);
          return next;
        });
      } else {
        const fallback = getPersuasiveFallback(chatUrl || ENV_WHATSAPP_FALLBACK, wasCorrected ? corrected : '');
        setMessages((prev) => {
          const next = [...prev, { role: 'assistant', content: fallback, responseType: 'text' }];
          const sid = currentSessionId || `s-${Date.now()}`;
          setSessions((sess) => {
            const updated = sess.find((s) => s.id === sid)
              ? sess.map((s) => (s.id === sid ? { ...s, messages: next, title: makeSessionTitle(next) } : s))
              : [{ id: sid, createdAt: Date.now(), messages: next, title: makeSessionTitle(next) }, ...sess];
            saveSessions(updated.slice(0, MAX_SESSIONS));
            return updated.slice(0, MAX_SESSIONS);
          });
          setCurrentSessionId(sid);
          return next;
        });
      }
      setLoading(false);
    }, 400);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (question) => {
    sendMessage(question);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-[9998] flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-primary-600 hover:bg-primary-700 text-white transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label={open ? 'Close chatbot' : 'Open chatbot'}
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[9999] w-full max-w-md rounded-xl shadow-2xl border border-gray-200 bg-white flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">LibertyPath Help</h3>
                <p className="text-xs text-white/90">Ask anything about the platform</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={startNewChat}
                className="p-1.5 rounded hover:bg-white/20 text-xs font-medium"
                title="Start new chat"
              >
                New chat
              </button>
              <button
                type="button"
                onClick={() => setShowHistory((h) => !h)}
                className="p-1.5 rounded hover:bg-white/20 text-xs font-medium"
                title="Chat history"
              >
                History
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-white/20"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat history list */}
          {showHistory && (
            <div className="border-b border-gray-200 bg-gray-50 max-h-48 overflow-y-auto">
              <p className="text-xs text-gray-500 px-3 py-2 font-medium">Previous chats (click to open)</p>
              {sessions.length === 0 ? (
                <p className="text-xs text-gray-400 px-3 pb-2">No previous chats yet.</p>
              ) : (
                <ul className="pb-2">
                  {sessions.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => loadSession(s)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white border-b border-gray-100 last:border-0 flex justify-between items-center"
                      >
                        <span className="truncate flex-1">{s.title || 'Chat'}</span>
                        <span className="text-xs text-gray-400 shrink-0 ml-2">
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto min-h-[240px] max-h-[50vh] p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-600 text-sm mb-3">Hi! I can help you with:</p>
                <p className="text-gray-500 text-xs">• What LibertyPath is & how it works</p>
                <p className="text-gray-500 text-xs">• Registration, packages, deposits & tasks</p>
                <p className="text-gray-500 text-xs">• Referrals, withdrawals & PIN</p>
                <p className="text-gray-500 text-xs">• Trust, security & long-term stability</p>
                <p className="text-gray-500 text-xs">• WhatsApp link & platform logo</p>
                <p className="text-gray-600 text-sm mt-4 font-medium">Click a suggestion below or type your question.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                  }`}
                >
                  {msg.responseType === 'logo' && (
                    <div className="mb-2">
                      <img src={logo} alt="LibertyPath logo" className="h-16 w-auto rounded" />
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{formatMessageText(msg.content)}</div>
                  {msg.link && (
                    <a
                      href={msg.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-primary-600 hover:underline font-medium"
                    >
                      Open WhatsApp link →
                    </a>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions */}
          <div className="px-3 py-2 border-t border-gray-100 bg-white max-h-28 overflow-y-auto">
            <p className="text-xs text-gray-500 mb-2">Suggestions (click to ask):</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSuggestionClick(q)}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-700 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                disabled={loading}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default Chatbot;
