// import { useStore } from "../store/store";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import Messages from "../components/Messages";
import GameOver from "../components/GameOver";
import Win from "../components/Win";
import Description from "../components/Description";
import { fetchDb } from "../store/fetch";
import { useQuery } from "@tanstack/react-query";
import { sendMessageToAPI } from "../store/api";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [scoreHistory, setScoreHistory] = useState([0]);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [isWin, setIsWin] = useState(null);

  const params = useParams();
  const currentId = parseInt(params.sid);
  const API_KEY = import.meta.env.VITE_API_KEY;

  const { data, error, isLoading } = useQuery({
    queryKey: [currentId],
    queryFn: () => fetchDb(currentId),
  });

  useEffect(() => {
    if (!isLoading && !error && data) {
      setSystemPrompt(data.system);
      setMessages([
        {
          role: "system",
          content: systemPrompt + " DO NOT INCLUDE THE SCORE IN THE TEXT",
        },
        { role: "assistant", content: data.start },
      ]);
      setChallengeDescription(data.description);
    }
  }, [data, isLoading, error, systemPrompt]);

  const sendMessage = async () => {
    const userInputMessage = userInput.trim();
    setUserInput("");
    setMessages([...messages, { role: "user", content: userInputMessage }]);
    const response = await sendMessageToAPI(
      messages,
      API_KEY,
      userInputMessage
    );
    if (!response) return;

    setUserInput("");
    setScore(score + response.score);
    setScoreHistory([...scoreHistory, response.score]);
    setMessages([...messages, response.newMessage, response.aiResponse]);
  };

  useEffect(() => {
    if (score <= -10 || scoreHistory.length >= 11) {
      setIsWin(false); // 游戏失败
    } else if (score >= 10) {
      setIsWin(true); // 游戏胜利
    }
  }, [score, scoreHistory]);

  const handleClick = () => {
    if (userInput.trim() === "") return;
    sendMessage();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // 阻止默认换行行为
      handleClick();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        Error: {error.message}
      </div>
    );
  }

  // Game logic
  if (isWin === false) {
    return <GameOver score={score} onRestart={onRestart} messages={messages} />;
  }
  if (isWin === true) {
    return <Win score={score} onRestart={onRestart} messages={messages} />;
  }

  /**
   * 重新开始游戏
   */
  function onRestart() {
    window.location.reload();
  }

  return (
    <div className="flex flex-col h-dvh bg-gray-50">
      <Description challengeDescription={challengeDescription} />
      <nav className="bg-white shadow-sm py-4 px-6 w-full z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">
            MTLove Score: <span className="text-blue-600">{score}</span>
          </h1>

          <div className="flex justify-end gap-2">
            <button
              className="btn"
              onClick={() => document.getElementById("my_modal_2").showModal()}
            >
              Challenge Description
            </button>

            <Link to="/" className="btn btn-neutral">
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 w-full max-w-4xl mx-auto pb-4 overflow-y-auto">
        <Messages messages={messages} scoreHistory={scoreHistory} />
      </div>

      <div className="bg-white border-t border-gray-200 py-4 z-10">
        <div className="max-w-4xl mx-auto px-4 flex gap-3">
          <textarea
            placeholder="Type your message here..."
            className="flex-1 min-h-[60px] max-h-[120px] p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
          ></textarea>
          <button
            onClick={handleClick}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
// pt-28 md:p-0
