import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

function App() {
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // States
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [roomInput, setRoomInput] = useState('general');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // 1. Maintain socket connection via useRef
  useEffect(() => {
    socketRef.current = io('http://localhost:2000');

    socketRef.current.on('connect', () => {
      console.log('Connected to socket server. Socket ID:', socketRef.current.id);
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
    });

    // Listen for incoming messages in this specific room
    socketRef.current.on('message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Auto-scroll to the newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 2. Join Room Handler (calls socket.join on backend)
  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const enteredName = nameInput.trim();
    const enteredRoom = (roomInput.trim() || 'general').toLowerCase();

    setUsername(enteredName);
    setRoom(enteredRoom);

    // Tell backend to put this socket into the actual room
    socketRef.current?.emit('join_room', {
      username: enteredName,
      room: enteredRoom
    });
  };

  // 3. Message send handler (sends to the active room)
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !username || !room) return;

    const messageData = {
      id: Date.now() + '-' + Math.random().toString(36).substring(2, 9),
      sender: username,
      room: room,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    socketRef.current?.emit('send_message', messageData);
    setText('');
  };

  return (
    <div className="relative flex items-center justify-center w-full h-screen bg-[#d1d7db] font-sans antialiased select-none">
      {/* Decorative Green Top Banner */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-[#00a884] z-0 hidden md:block" />

      {/* Name & Room Join Modal */}
      {!username && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm overflow-hidden bg-white rounded-2xl shadow-2xl transition-all">
            <div className="bg-[#008069] text-white p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center bg-white/20 rounded-full shadow-inner">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold tracking-tight">Join a Chat Room</h3>
              <p className="text-xs text-emerald-100 mt-1">Enter your display name and room ID to enter</p>
            </div>

            <form onSubmit={handleJoinRoom} className="p-6 bg-white space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex, Sarah..."
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20 transition-all placeholder:text-gray-400"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Room Name / ID
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-400 font-bold text-sm">#</span>
                  <input
                    type="text"
                    placeholder="general"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20 transition-all placeholder:text-gray-400"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Only users with the same Room ID can chat with each other.</p>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#00a884] hover:bg-[#008f6f] active:scale-[0.99] text-white text-sm font-semibold rounded-lg shadow-md shadow-[#00a884]/25 transition-all cursor-pointer"
              >
                Enter Room
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Chat Card */}
      <div className="relative z-10 flex flex-col w-full max-w-4xl h-full md:h-[92vh] md:max-h-[820px] bg-white md:rounded-xl shadow-2xl overflow-hidden">
        {/* Header with Room Name */}
        <header className="flex items-center justify-between px-4 py-2.5 bg-[#008069] text-white shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#128c7e] text-white font-bold text-sm uppercase ring-2 ring-white/30 shadow-xs">
              {room ? room.slice(0, 2) : 'RM'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wide flex items-center gap-1.5">
                <span>#{room || 'general'}</span>
                {username && (
                  <span className="text-[11px] font-normal text-emerald-100 bg-white/15 px-2 py-0.5 rounded-full">
                    {username}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#25d366] animate-pulse' : 'bg-red-400'}`}></span>
                <span>{isConnected ? 'connected to room' : 'offline / connecting...'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-emerald-100">
            <button title="Search" className="p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button title="Menu" className="p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
              </svg>
            </button>
          </div>
        </header>

        {/* Message Feed */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 chat-wallpaper">
          <div className="flex justify-center my-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[#54656f] bg-white/80 backdrop-blur-xs rounded-lg shadow-2xs border border-black/5">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Room #{room || 'general'} · Private WebSocket Room
            </span>
          </div>

          {messages.map((msg, index) => {
            const isSystem = msg.isSystem || msg.sender === 'System';
            const isMe = msg.sender === username;

            if (isSystem) {
              return (
                <div key={index} className="flex justify-center my-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 text-[#54656f] text-xs font-medium rounded-lg shadow-2xs border border-gray-200/60">
                    <span>{msg.text}</span>
                    {msg.time && <span className="text-[10px] text-gray-400">· {msg.time}</span>}
                  </div>
                </div>
              );
            }

            return (
              <div key={index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`relative max-w-[82%] sm:max-w-[70%] min-w-[90px] px-3.5 pt-2 pb-1.5 shadow-xs text-sm break-words transition-all ${
                    isMe
                      ? 'bg-[#d9fdd3] text-[#111b21] rounded-2xl rounded-tr-xs'
                      : 'bg-white text-[#111b21] rounded-2xl rounded-tl-xs border border-gray-100'
                  }`}
                >
                  {!isMe && (
                    <div className="text-xs font-semibold text-[#128c7e] mb-0.5">
                      {msg.sender}
                    </div>
                  )}

                  <div className="text-[14.2px] leading-relaxed pr-16 text-[#111b21]">
                    {msg.text}
                  </div>

                  <div className="absolute right-2.5 bottom-1 flex items-center gap-1 text-[10px] text-gray-500 font-normal select-none">
                    <span>{msg.time || 'now'}</span>
                    {isMe && (
                      <span className="text-[#53bdeb] text-xs font-bold leading-none tracking-tighter">
                        ✓✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </main>

        {/* Input Bar */}
        <footer className="flex items-center gap-2 p-3 bg-[#f0f2f5] border-t border-gray-200 shrink-0">
          <button type="button" className="p-2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer" title="Emoji">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <form onSubmit={handleSendMessage} className="flex items-center flex-1 gap-2">
            <div className="flex-1 bg-white rounded-full shadow-2xs border border-gray-200/80 px-4 py-2 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
              <input
                type="text"
                placeholder={username ? `Message #${room}...` : "Join a room to chat"}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={!username}
                className="w-full text-sm text-[#111b21] bg-transparent outline-none placeholder:text-gray-400 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={!username || !text.trim()}
              className="flex items-center justify-center w-11 h-11 bg-[#00a884] hover:bg-[#008f6f] active:scale-95 disabled:bg-gray-300 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed text-white rounded-full shadow-md shadow-[#00a884]/30 transition-all cursor-pointer shrink-0"
              title="Send"
            >
              <svg className="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}

export default App;
