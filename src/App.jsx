import React, { useState, useEffect, useRef } from 'react';
import { Send, HelpCircle, User, Bot, ExternalLink } from 'lucide-react';

const CAEnrollBot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Assalamualaikum 👋 Hope you’re doing well!
      
I’m the Support Assistant at ABC Institute of Accountancy, and I look after our CA Program.
How can I help you today? Feel free to ask about:

• Course details and subject options
• Our teaching approach and testing system
• Fees, discounts, and offers
• Payment, enrollment, or LMS support

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

  // Parse message content with proper formatting
  const parseMessage = (content) => {
    const elements = [];
    let currentText = '';
    let index = 0;
    
    // First clean up markdown
    content = content
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1');
    
    // Process character by character
    while (index < content.length) {
      // Check for URL
      const urlMatch = content.slice(index).match(/^(https?:\/\/[^\s\)]+)/);
      
      if (urlMatch) {
        // Save any accumulated text
        if (currentText) {
          elements.push({ type: 'text', content: currentText });
          currentText = '';
        }
        
        // Add URL
        elements.push({ type: 'url', content: urlMatch[1] });
        index += urlMatch[1].length;
      } else if (content[index] === '\n') {
        // Handle line breaks
        if (currentText) {
          elements.push({ type: 'text', content: currentText });
          currentText = '';
        }
        elements.push({ type: 'break' });
        index++;
      } else {
        currentText += content[index];
        index++;
      }
    }
    
    // Add any remaining text
    if (currentText) {
      elements.push({ type: 'text', content: currentText });
    }
    
    return elements;
  };

  const formatMessage = (content) => {
    const elements = parseMessage(content);
    
    return elements.map((element, idx) => {
      if (element.type === 'url') {
        // Clean URL for display
        let displayText = element.content;
        try {
          const urlObj = new URL(element.content);
          displayText = urlObj.hostname.replace('www.', '') + urlObj.pathname;
          if (displayText.length > 45) {
            displayText = displayText.substring(0, 42) + '...';
          }
        } catch (e) {
          if (displayText.length > 45) {
            displayText = displayText.substring(0, 42) + '...';
          }
        }
        
        return (
          <a
            key={idx}
            href={element.content}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 underline decoration-2 underline-offset-2 font-medium transition-colors my-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <span>{displayText}</span>
            <ExternalLink size={14} className="flex-shrink-0" />
          </a>
        );
      } else if (element.type === 'break') {
        return <br key={idx} />;
      } else {
        return <span key={idx}>{element.content}</span>;
      }
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

      const cleanedResponse = data.response
        .replace(/【\d+:\d+†source】/g, '')
        .replace(/\[\d+\]/g, '')
        .replace(/\[citation:\d+\]/g, '')
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
    <div className="h-screen w-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-5 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
            <HelpCircle size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Radic</h1>
            <p className="text-sm text-green-100">Enrollment Support for CA Students</p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-blue-500' : 'bg-green-600'
              }`}>
                {msg.role === 'user' ? <User size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
              </div>

              <div 
                className={`max-w-2xl rounded-2xl px-5 py-4 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white rounded-tr-sm' 
                    : 'bg-white text-gray-800 rounded-tl-sm border border-gray-200'
                }`}
              >
                <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                  {formatMessage(msg.content)}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-green-600 flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 border border-gray-200 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask about CA enrollment..." 
              className="flex-1 rounded-full border border-gray-300 px-5 py-3 text-[15px] focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-20 transition"
            />
            <button 
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {[
              'What are the eligibility criteria?',
              'What are the fees?',
              'What are the important deadlines?',
              'How can I contact support?'
            ].map((query) => (
              <button
                key={query}
                onClick={() => handleQuickAction(query)}
                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-full transition border border-green-200"
              >
                {query.replace('What are the ', '').replace('How can I ', '').replace('?', '')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CAEnrollBot;
