import React, { useState } from 'react'
import useSpeechToText from './hooks/useSpeechToText';
import { useSession, useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';
//import DateTimePicker from 'react-datetime-picker';

const App = () => {
  // Google API
  //const [start, setStart] = useState(new Date());
  //const [end, setEnd] = useState(new Date());
  //const [eventName, setEventName] = useState("");
  //const [eventDescription, setEventDescription] = useState("");

  const session = useSession();
  const supabase = useSupabaseClient();
  const { isLoading } = useSessionContext();

  if(isLoading) {
    return <></>
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
      console.log(error)
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
    }
    await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        'Authorization':'Bearer ' + session.provider_token
      },
      body: JSON.stringify(event)
    }).then((data) => {
      return data.json();
    }).then((data)=> {
      console.log(data);
      alert("Event successfully created")
    })
  }

  console.log(session);

  // Web Speech API
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
        {session ?
          <>
            <h1>Welcome {session.user.email}</h1>
            <button onClick={() => googleSignOut()}>Sign Out</button>
          </>
          :
          <>
            <button onClick={() => googleSignIn()}>Sign in with Google</button>
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
            onChange={(e)=> { setTextInput(e.target.value)}}
          />
          <button id='voice-button' 
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