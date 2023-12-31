import React, { useEffect, useState } from "react";
import Chat from "./Chat";
import App from "./App";
import io from "socket.io-client";

function WaitRoom({ username, yourLanguage, learnLanguage, portNumber }) {
  const [socket, setSocket] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [landingPage, setLandingPage] = useState(false);
  const [dictionary, setDictionary] = useState({});
  const combinedLang = yourLanguage + learnLanguage;
  const roomCount = Object.keys(dictionary).length;

  useEffect(() => {
    // Create and connect the socket only once
    if (!socket) {
      const newSocket = io.connect('http://localhost:' + portNumber);
      setSocket(newSocket);

      newSocket.on("connect", () => {
        newSocket.emit("addKeyValuePair", { username, language: combinedLang });
      });

      newSocket.on("updateDictionary", (updatedDictionary) => {
        setDictionary(updatedDictionary);
      });

      newSocket.emit("addAndCheckPort", portNumber, (res) => {
        if (res != false) {
          newSocket.emit("removePort", portNumber);
          newSocket.emit("join_room", portNumber);
          setShowChat(true);
        }
      })
    }

    handleJoinRoom();

    // Clean up event listeners when the component unmounts
    return () => {
      if (socket) { 
        socket.off("updateDictionary");
      }
    };
  }, [username, combinedLang, socket]);

  const handleLeaveWaitRoom = () => {
    if (socket) {
      socket.emit("removeKeyValuePair", socket.id);
      socket.disconnect();
    }
    setLandingPage(true);
  }

  // Watch the dictionary state and trigger handleJoinRoom() when it changes
  useEffect(() => {
    handleJoinRoom();
  }, [dictionary]);

  const handleJoinRoom = () => {
    if (roomCount > 0 && roomCount % 2 === 0) {
      socket.emit("join_room", portNumber);
      setShowChat(true);
    }
  }

  return (
    <div className="App">
      {showChat ? (
        <Chat socket={socket} username={username} room={portNumber} dictionary={dictionary} yourLanguage={yourLanguage} learnLanguage={learnLanguage} />
      ) : (!landingPage ? (
        (
          <div className="wait-display">
            <div className="wait-message">
              <p>Waiting for another user to join...</p>
              <div className="wait-backbtn" style={{ padding: "10px", paddingLeft: "70px" }}>
                <button onClick={handleLeaveWaitRoom} style={{ color: "black", backgroundColor: "lightblue", border: "white", padding: "8px", fontWeight: "bold" }}>Leave Room</button>
              </div>
            </div>
          </div>
        )
      ) : (<App />)
      )}
    </div>
  );
}

export default WaitRoom;
