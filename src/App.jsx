import React, { useState, useEffect, useRef } from 'react';
import { Send, HelpCircle, User, Bot, ExternalLink } from 'lucide-react';

const CAEnrollBot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! 👋 I'm your CA Enrollment Assistant.

I can help you with:
• Subject details
• Fees, discounts and offers
• Enrollment process
• Payment information

What would you like to know?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Function to clean markdown and parse message content
  const formatMessage = (content) => {
    // Clean up markdown-style formatting
    let cleanContent = content
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
      .replace(/\*([^*]+)\*/g, '$1') // Remove *italic*
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$2') // Convert [text](url) to just url
      .replace(/`([^`]+)`/g, '$1'); // Remove `code`

    // Split by lines to preserve structure
    const lines = cleanContent.split('\n');
    
    return lines.map((line, lineIdx) => {
      if (!line.trim()) return <br key={lineIdx} />;
      
      // URL detection - matches http:// or https:// URLs
      const urlRegex = /(https?:\/\/[^\s)]+)/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      // Find all URLs in the line
      while ((match = urlRegex.exec(line)) !== null) {
        // Add text before URL
        if (match.index > lastIndex) {
          parts.push({
            type: 'text',
            content: line.substring(lastIndex, match.index)
          });
        }
        // Add URL
        parts.push({
          type: 'url',
          content: match[0]
        });
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (lastIndex < line.length) {
        parts.push({
          type: 'text',
          content: line.substring(lastIndex)
        });
      }

      // If no URLs found, treat entire line as text
      if (parts.length === 0) {
        parts.push({ type: 'text', content: line });
      }

      return (
        <div key={lineIdx} className="mb-2 last:mb-0">
          {parts.map((part, idx) => {
            if (part.type === 'url') {
              // Extract a clean display name
              let displayUrl = part.content;
              try {
                const url = new URL(part.content);
                displayUrl = url.hostname + url.pathname;
                if (displayUrl.length > 40) {
                  displayUrl = displayUrl.substring(0, 37) + '...';
                }
              } catch (e) {
                if (displayUrl.length > 40) {
                  displayUrl = displayUrl.substring(0, 37) + '...';
                }
              }

              return (
                <a
                  key={idx}
                  href={part.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 underline font-medium transition-colors mx-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {displayUrl}
                  <ExternalLink size={14} className="inline flex-shrink-0" />
                </a>
              );
            }
            return <span key={idx}>{part.content}</span>;
          })}
        </div>
      );
    });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          threadId: threadId
        }),
      });

      const data = await response.json();
      
      if (data.threadId && !threadId) {
        setThreadId(data.threadId);
      }

      // Remove citations from the response
      const cleanedResponse = data.response
        .replace(/【\d+:\d+†source】/g, '')
        .replace(/\[\d+\]/g, '')
        .replace(/\[citation:\d+\]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: cleanedResponse
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (query) => {
    setInput(query);
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-green-100 min-h-screen w-full flex flex-col">
      {/* Header */}
      <div className="bg-green-600 text-white p-6 flex items-center space-x-4 shadow-lg" style={{
        background: 'rgba(46, 125, 50, 0.95)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="w-12 h-12 rounded-full bg-green-700 flex items-center justify-center shadow-md">
          <HelpCircle className="text-white" size={28} />
        </div>
        <div>
          <h1 className="font-bold text-2xl">Radic</h1>
          <p className="text-sm opacity-80">Enrollment Support for CA Students</p>
        </div>
      </div>

      {/* Chat Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        <div className="max-w-5xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                msg.role === 'user' 
                  ? 'bg-blue-600' 
                  : 'bg-green-600'
              }`}>
                {msg.role === 'user' ? (
                  <User size={20} className="text-white" />
                ) : (
                  <Bot size={20} className="text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div 
                className={`max-w-3xl rounded-2xl p-5 shadow-md ${
                  msg.role === 'user' 
                    ? 'bg-green-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none'
                }`}
                style={{
                  background: msg.role === 'user' 
                    ? 'rgba(22, 101, 52, 0.9)' 
                    : 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(10px)',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(0, 0, 0, 0.05)',
                  animation: 'fadeIn 0.3s ease-out'
                }}
              >
                <div className="text-base leading-relaxed">
                  {formatMessage(msg.content)}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 flex items-center justify-center shadow-md">
                <Bot size={20} className="text-white" />
              </div>
              <div 
                className="bg-white rounded-2xl rounded-tl-none px-5 py-4 shadow-md"
                style={{
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="flex space-x-1">
                  <span className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                  <span className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div 
        className="bg-green-600 p-5 shadow-lg"
        style={{
          background: 'rgba(46, 125, 50, 0.95)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center space-x-3">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about CA enrollment..." 
              className="flex-1 rounded-full px-6 py-4 text-base bg-white focus:outline-none focus:ring-2 focus:ring-green-300 text-gray-800 placeholder-gray-500 shadow-sm"
            />
            <button 
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="w-14 h-14 rounded-full bg-green-700 text-white flex items-center justify-center hover:bg-green-800 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={24} />
            </button>
          </div>
          <div className="flex justify-center mt-3 space-x-4 flex-wrap gap-2">
            <button onClick={() => handleQuickAction('What are the eligibility criteria?')} className="text-xs text-white opacity-90 hover:opacity-100 transition px-3 py-1 rounded-full hover:bg-green-700">Eligibility</button>
            <button onClick={() => handleQuickAction('What are the fees?')} className="text-xs text-white opacity-90 hover:opacity-100 transition px-3 py-1 rounded-full hover:bg-green-700">Fees</button>
            <button onClick={() => handleQuickAction('What are the important deadlines?')} className="text-xs text-white opacity-90 hover:opacity-100 transition px-3 py-1 rounded-full hover:bg-green-700">Deadlines</button>
            <button onClick={() => handleQuickAction('How can I contact support?')} className="text-xs text-white opacity-90 hover:opacity-100 transition px-3 py-1 rounded-full hover:bg-green-700">Contact</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CAEnrollBot;
