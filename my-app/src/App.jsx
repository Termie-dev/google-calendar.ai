import React, { useState } from 'react'
import useSpeechToText from './hooks/useSpeechToText';
import { useSession, useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';
import { GoogleGenerativeAI } from "@google/generative-ai"
import DateTimePicker from 'react-datetime-picker';

const App = () => {
  // Move all hooks to the top to maintain hook order
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date());
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [textInput, setTextInput] = useState('');
  
  // Web Speech API
  const { isListening, transcript, startListening, stopListening } = useSpeechToText();
  
  // Google Auth
  const session = useSession();
  const supabase = useSupabaseClient();
  const { isLoading } = useSessionContext();

  // Google Gemini AI
  const genAI = new GoogleGenerativeAI("AIzaSyDRp6KQEqmf86gSXyFtG_qD5jRov0AtMZY");
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  if (isLoading) {
    return <></>;
  }

  async function processInput() {
    try {
      const todayDateString = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

      const prompt = `
        You are an AI that extracts structured event details from user input. 
        Today's date is **${todayDateString}**. Assume that all relative time references (e.g., "tomorrow", "next Monday") are based on this date.
      
        Given a natural language event description, return a JSON object with the following keys:
      
        {
          "summary": "string",
          "description": "string",
          "start": {
            "dateTime": "YYYY-MM-DDTHH:mm:ss",
            "timeZone": "${Intl.DateTimeFormat().resolvedOptions().timeZone}"
          },
          "end": {
            "dateTime": "YYYY-MM-DDTHH:mm:ss",
            "timeZone": "${Intl.DateTimeFormat().resolvedOptions().timeZone}"
          }
        }
      
        **Example Input and Expected Output:**
      
        1. **Input:** "Schedule a team meeting about project updates on February 20, 2025, from 3 PM to 4 PM in New York."
      
        **Output:**
        {
          "summary": "Team Meeting",
          "description": "Discussion about project updates",
          "start": {
            "dateTime": "2025-02-20T15:00:00",
            "timeZone": "${Intl.DateTimeFormat().resolvedOptions().timeZone}"
          },
          "end": {
            "dateTime": "2025-02-20T16:00:00",
            "timeZone": "${Intl.DateTimeFormat().resolvedOptions().timeZone}"
          }
        }
      
        2. **Input:** "Doctor's appointment tomorrow at 1:00 PM"
      
        **Output (assuming today is ${todayDateString}):**
        {
          "summary": "Doctor's Appointment",
          "description": "Doctor visit",
          "start": {
            "dateTime": "${todayDateString}T13:00:00",
            "timeZone": "${Intl.DateTimeFormat().resolvedOptions().timeZone}"
          },
          "end": {
            "dateTime": "${todayDateString}T14:00:00",
            "timeZone": "${Intl.DateTimeFormat().resolvedOptions().timeZone}"
          }
        }
      
        Now, process this input and return the JSON object:
        "${textInput}"
      `;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
        console.log("Gemini Response:", text);

        const eventDetails = JSON.parse(text);
        console.log(eventDetails);

        const today = new Date();
        today.setHours(12, 0, 0, 0); // Default to 12:00 PM

        const startTime = eventDetails.start?.dateTime ? new Date(eventDetails.start.dateTime) : new Date();

        // Ensure endTime is set to 1 hour later if missing
        const endTime = eventDetails.end?.dateTime
          ? new Date(eventDetails.end.dateTime)
          : new Date(startTime.getTime() + 60 * 60 * 1000);


        setEventName(eventDetails.summary || "No title");
        setEventDescription(eventDetails.description || "No description");
        setStart(startTime);
        setEnd(endTime);
    } catch (error) {
        console.error("Error processing input:", error);
    }
  }

  async function googleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar'
      }
    });
    if (error) {
      alert("Error logging into Google provider with Supabase");
      console.log(error);
    }
  }

  async function googleSignOut() {
    await supabase.auth.signOut();
  }

  async function createCalendarEvent() {
    const event = {
      'summary': eventName,
      'description': eventDescription,
      'start': {
        'dateTime': start.toISOString(),
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      'end': {
        'dateTime': end.toISOString(),
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
    await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        'Authorization': 'Bearer ' + session.provider_token
      },
      body: JSON.stringify(event)
    }).then((data) => {
      return data.json();
    }).then((data) => {
      console.log(data);
      alert("Event successfully created");
    });
  }

  const startStopListening = () => {
    isListening ? stopVoiceInput() : startListening();
  };

  const stopVoiceInput = () => {
    setTextInput(prevVal => prevVal + (transcript.length ? (prevVal.length ? ' ' : '') + transcript : ''));
    stopListening();
  };

  return (
    <div>
      <header>
        {session ?
          <>
            <h1>Welcome {session.user.email}</h1>
            <button onClick={googleSignOut}>Sign Out</button>
          </>
          :
          <>
            <button onClick={googleSignIn}>Sign in with Google</button>
          </>
        }
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
            onChange={(e) => { setTextInput(e.target.value); }}
          />
          <button onClick={processInput}>Extract Event</button>
          <button id='voice-button' 
            onClick={startStopListening}>
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

export default App;