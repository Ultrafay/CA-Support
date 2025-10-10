import React, { useState, useEffect, useRef } from 'react';
import { Send, HelpCircle } from 'lucide-react';

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
        .replace(/【\d+:\d+†source】/g, '') // Remove citation format like 【4:0†source】
        .replace(/\[\d+\]/g, '') // Remove [1], [2], etc.
        .replace(/\[citation:\d+\]/g, '') // Remove [citation:1]
        .replace(/\s+/g, ' ') // Clean up extra spaces
        .trim();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response
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
      <div className="max-w-md w-full h-[80vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 flex items-center space-x-3" style={{
          background: 'rgba(46, 125, 50, 0.95)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center">
            <HelpCircle className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg">Radic</h1>
            <p className="text-xs opacity-80">Enrollment Support for CA Students</p>
          </div>
        </div>

        {/* Chat Container */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-green-50 to-green-100"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-xs md:max-w-md rounded-2xl p-4 shadow-sm ${
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
                <p className="whitespace-pre-line text-sm">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start items-center">
              <div 
                className="bg-white rounded-2xl rounded-tl-none px-4 py-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)'
                }}
              >
                <div className="flex space-x-1">
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div 
          className="bg-green-600 p-3"
          style={{
            background: 'rgba(46, 125, 50, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="flex items-center space-x-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about CA enrollment..." 
              className="flex-1 rounded-full px-4 py-3 bg-white bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-green-300 text-gray-800 placeholder-green-700 placeholder-opacity-60"
            />
            <button 
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="w-12 h-12 rounded-full bg-green-700 text-white flex items-center justify-center hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
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
