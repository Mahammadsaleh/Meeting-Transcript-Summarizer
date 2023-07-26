import React, { useState } from "react";
import { vttToPlainText } from "vtt-to-text";
import { Configuration, OpenAIApi } from "openai";
import { useAmp } from "next/amp";

// LoadingButton component
const LoadingButton = ({ isLoading, onClick, children }) => (
  <button
    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg shadow-md"
    onClick={onClick}
    disabled={isLoading}
  >
    {isLoading ? (
      <svg
        className="animate-spin h-5 w-5 mr-2 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    ) : (
      children
    )}
  </button>
);

function Home() {
  const [summary, setSummary] = useState("");
  const [plainText, setPlainText] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [speakers, setSpeakers] = useState([]);
  const [mostFrequentSpeaker, setMostFrequentSpeaker] = useState("");

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = function (event) {
        const vttContent = event.target.result;
        var extractedText = vttToPlainText(vttContent);
        extractedText = extractedText.substring(0, 1000);
        setPlainText(extractedText);
        const regex = /<v\s+([^>]+)>/g;

        const usernames = [];
        let match;

        while ((match = regex.exec(vttContent)) !== null) {
          const usernameTag = match[0];
          const username = usernameTag.match(/<v\s+([^>]+)>/)[1].trim();
          if (!usernames.includes(username)) {
            usernames.push(username);
          }
        }

        setSpeakers(usernames);

        // Find the most frequent speaker
        const speakerCounts = {};
        for (let speaker of usernames) {
          speakerCounts[speaker] = (speakerCounts[speaker] || 0) + 1;
        }
        const sortedSpeakers = Object.keys(speakerCounts).sort(
          (a, b) => speakerCounts[b] - speakerCounts[a]
        );
        const mostFrequent = sortedSpeakers[0];
        setMostFrequentSpeaker(mostFrequent);
      };

      reader.readAsText(file);
    }
  };

  const fetchSummary = async () => {
    try {
      setIsLoading(true);

      const configuration = new Configuration({
        apiKey: "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",
      });
      const openai = new OpenAIApi(configuration);
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: plainText
          ? `What is this content (${plainText}) talking about? Tell me in an expanded way.`
          : `Say user (please enter the file for summarizing)`,
        temperature: temperature,
        max_tokens: 300,
      });
      const summary = response.data.choices[0].text.trim();
      setSummary(summary);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-blue-100 p-20">
      <div className="w-full max-w-md p-6 mt-8 rounded-lg shadow-lg bg-white">
        <h1 className="font-sans text-4xl flex font-bold mb-6 text-indigo-400">
          MEETING TALK SUMMARIZER
        </h1>
        <div className="flex space-x-3 items-center">
          <label htmlFor="fileInput" className="text-lg text-gray-800">
            Upload VTT File:
          </label>
          <input
            type="file"
            id="fileInput"
            accept=".vtt"
            className="border  border-gray-300 rounded-lg py-2 px-3 text-gray-800 focus:outline-none file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-100 file:text-indigo-700
            hover:file:bg-indigo-200 "
            onChange={handleFileChange}
          />
        </div>
        <div className="flex space-x-5 items-center  mt-4">
          <label htmlFor="temperature" className="text-lg text-gray-800">
            Creativity level:
          </label>
          <input
            type="number"
            id="temperature"
            step="0.1"
            min="0"
            max="1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="border border-gray-300 rounded-lg py-2 px-4 text-gray-800 focus:outline-none "
          />
          <LoadingButton onClick={fetchSummary}>Get Summary</LoadingButton>
        </div>
        <div className="w-full max-w-md p-4 mt-8 rounded-lg shadow-lg bg-white">
          <h2 className="text-2xl font-bold text-indigo-400 mb-4">Summary</h2>
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin h-8 w-8 text-indigo-500 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-gray-800">Loading summary...</p>
            </div>
          ) : (
            <p className="text-gray-800">{summary}</p>
          )}
        </div>
        <div className="w-full max-w-md p-4 mt-4 rounded-lg shadow-lg bg-white">
          <h2 className="text-2xl font-bold text-indigo-400 mb-4">Speakers</h2>
          <div className="flex flex-wrap">
            {speakers.map((speaker, index) => (
              <span
                key={index}
                className={`ml-2 mb-4 p-2 shadow-md rounded-lg ${
                  speaker === mostFrequentSpeaker
                    ? "bg-green-200"
                    : "bg-gray-200"
                }`}
              >
                {speaker} {speaker === mostFrequentSpeaker && "- Main speaker"}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 text-gray-800">
          &copy; {new Date().getFullYear()} Mahammadsaleh Abbas. All rights
          reserved.
        </div>
        
      </div>
    </div>
  );
}

export default Home;
