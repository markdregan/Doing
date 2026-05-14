import { useState, useRef, useCallback, useEffect } from 'react'

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}

interface UseSpeechRecognitionReturn {
  isRecording: boolean
  supported: boolean
  startRecording: () => void
  stopRecording: () => void
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

const SpeechRecognitionApi =
  typeof window !== 'undefined'
    ? (window.SpeechRecognition as new () => SpeechRecognition) ||
      (window.webkitSpeechRecognition as new () => SpeechRecognition)
    : null

export function useSpeechRecognition(
  onTranscript: (text: string) => void,
  onError?: (error: string) => void
): UseSpeechRecognitionReturn {
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supported = SpeechRecognitionApi !== null

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
    }
  }, [])

  const clearSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
  }, [])

  const resetSilenceTimeout = useCallback(() => {
    clearSilenceTimeout()
    silenceTimeoutRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }, 10000)
  }, [clearSilenceTimeout])

  const startRecording = useCallback(() => {
    if (!SpeechRecognitionApi) return

    // Abort any existing instance first
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }

    const recognition = new SpeechRecognitionApi()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      resetSilenceTimeout()

      // Get the latest final transcript
      for (let i = event.results.length - 1; i >= 0; i--) {
        const result = event.results[i]
        if (result.isFinal) {
          onTranscript(result[0].transcript + ' ')
          break
        }
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      onError?.(event.error)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
      clearSilenceTimeout()
    }

    recognitionRef.current = recognition
    setIsRecording(true)
    resetSilenceTimeout()
    recognition.start()
  }, [onTranscript, onError, resetSilenceTimeout, clearSilenceTimeout])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    clearSilenceTimeout()
    setIsRecording(false)
  }, [clearSilenceTimeout])

  return {
    isRecording,
    supported,
    startRecording,
    stopRecording,
  }
}
