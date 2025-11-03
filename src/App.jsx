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

  // Function to parse and format message content
  const formatMessage = (content) => {
    // Split content by lines to preserve formatting
    const lines = content.split('\n');
    
    return lines.map((line, lineIdx) => {
      // Check if line contains URLs
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = line.split(urlRegex);
      
      return (
        <span key={lineIdx}>
          {parts.map((part, idx) => {
            // Check if this part is a URL
            if (urlRegex.test(part)) {
              return (
                <a
                  key={idx}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {part.length > 50 ? part.substring(0, 47) + '...' : part}
                  <ExternalLink size={14} className="inline" />
                </a>
              );
            }
            return <span key={idx}>{part}</span>;
          })}
          {lineIdx < lines.length - 1 && <br />}
        </span>
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
    <div className="bg-green-50 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-5xl h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-green-600 text-white p-6 flex items-center space-x-4" style={{
          background: 'rgba(46, 125, 50, 0.95)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="w-12 h-12 rounded-full bg-green-700 flex items-center justify-center">
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
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-green-50 to-green-100"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
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
                className={`max-w-2xl rounded-2xl p-5 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-green-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none'
                }`}
                style={{
                  background: msg.role === 'user' 
                    ? 'rgba(22, 101, 52, 0.9)' 
                    : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
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
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div 
                className="bg-white rounded-2xl rounded-tl-none px-5 py-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)'
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

        {/* Input Area */}
        <div 
          className="bg-green-600 p-5"
          style={{
            background: 'rgba(46, 125, 50, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="flex items-center space-x-3">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about CA enrollment..." 
              className="flex-1 rounded-full px-6 py-4 text-base bg-white bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-green-300 text-gray-800 placeholder-green-700 placeholder-opacity-60"
            />
            <button 
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="w-14 h-14 rounded-full bg-green-700 text-white flex items-center justify-center hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={24} />
            </button>
          </div>
          <div className="flex justify-center mt-2 space-x-4">
            <button onClick={() => handleQuickAction('What are the eligibility criteria?')} className="text-xs text-white opacity-80 hover:opacity-100 transition">Eligibility</button>
            <button onClick={() => handleQuickAction('What are the fees?')} className="text-xs text-white opacity-80 hover:opacity-100 transition">Fees</button>
            <button onClick={() => handleQuickAction('What are the important deadlines?')} className="text-xs text-white opacity-80 hover:opacity-100 transition">Deadlines</button>
            <button onClick={() => handleQuickAction('How can I contact support?')} className="text-xs text-white opacity-80 hover:opacity-100 transition">Contact</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CAEnrollBot;
