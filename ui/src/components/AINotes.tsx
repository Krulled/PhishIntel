import React, { useEffect, useState } from 'react'
import { getScreenshotNotes } from '../services/apiClient'

interface AINotesProps {
  notes: string[]
  scanId?: string | null
}

export default function AINotes({ notes, scanId }: AINotesProps) {
  const [screenshotNotes, setScreenshotNotes] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    let cancelled = false
    
    const fetchScreenshotNotes = async () => {
      if (!scanId) return
      
      setLoading(true)
      try {
        const notes = await getScreenshotNotes(scanId)
        if (!cancelled) {
          setScreenshotNotes(notes)
        }
      } catch (error) {
        // Silent fail - screenshot notes are optional
        if (!cancelled) {
          setScreenshotNotes([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchScreenshotNotes()
    
    return () => { cancelled = true }
  }, [scanId])

  // Merge textual and screenshot notes, removing case-insensitive duplicates
  const allNotes = React.useMemo(() => {
    const textualNotes = notes || []
    const combinedNotes = [...textualNotes]
    
    // Add screenshot notes that aren't duplicates (case-insensitive)
    screenshotNotes.forEach(screenshotNote => {
      const isDuplicate = textualNotes.some(textNote => 
        textNote.toLowerCase().includes(screenshotNote.toLowerCase()) ||
        screenshotNote.toLowerCase().includes(textNote.toLowerCase())
      )
      
      if (!isDuplicate) {
        combinedNotes.push(screenshotNote)
      }
    })
    
    return combinedNotes
  }, [notes, screenshotNotes])

  if (allNotes.length === 0 && !loading) return null
  
  return (
    <div className="mt-3 rounded-lg border border-indigo-400/30 bg-indigo-500/10 p-3">
      <div className="mb-1 text-sm font-medium">
        AI notes
        {loading && <span className="ml-2 text-xs text-indigo-300">(loading screenshot analysis...)</span>}
      </div>
      <ul className="list-disc pl-5 text-sm text-indigo-200">
        {allNotes.map((note, i) => (
          <li key={i}>{note}</li>
        ))}
      </ul>
    </div>
  )
}