import React, { useState } from 'react'
import useSpeechToText from './hooks/useSpeechToText';

const App = () => {
  const [textInput, setTextInput] = useState('')
  const {isListening, transcript, startListening, stopListening} = useSpeechToText()
  
  const startStopListening = () => {
    isListening ? stopVoiceInput() : startListening()
  }

  const stopVoiceInput = () => {
    setTextInput(prevVal => prevVal + (transcript.length ? (prevVal.length ? ' ': '') + transcript : ''))
    stopListening()
  }

  return (
    <div>
      <header>
        <h1>Welcome, Dexter Morgan!</h1>
      </header>

      <main>
        <div>
          <p>Calendar goes here</p>
        </div>
      </main>

      <footer>
        <div id="footer-container">
          <input id="text-bar"
            type="text"
            placeholder="Type your message..."
            disabled={isListening}
            value={isListening ? textInput + (transcript.length ? (textInput.length ? ' ' : '') + transcript : '') : textInput}
            onChange={(e)=> { setTextInput(e.target.value)}}
          />
          <button 
          onClick={()=>{startStopListening()}}
            >
            {isListening ? (
              <img src="listening-icon.png" alt="Listening" />
            ) : (
              <img src="voice-icon.jpg" alt="Voice Input" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App