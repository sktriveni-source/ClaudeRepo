import { useState } from "react";
import type { Comment } from "../types";

interface Props {
  comments: Comment[];
  onPost: (text: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  currentActor: string;
}

export default function CommentThread({ comments, onPost, onDelete, currentActor }: Props) {
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...comments].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  async function handlePost() {
    if (!text.trim()) return;
    setError(null);
    setPosting(true);
    try {
      await onPost(text.trim());
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="comment-thread">
      {error && <div className="form-error">{error}</div>}
      {sorted.length === 0 ? (
        <p className="hint-text">No comments yet. Start the discussion below.</p>
      ) : (
        <ul className="comment-list">
          {sorted.map((c) => (
            <li key={c.id} className="comment-item">
              <div className="comment-meta">
                <span className="comment-author">{c.author}</span>
                <span className="comment-time">{new Date(c.timestamp).toLocaleString()}</span>
                {c.author === currentActor && (
                  <button className="btn btn-link danger comment-delete" onClick={() => onDelete(c.id)}>
                    Delete
                  </button>
                )}
              </div>
              <p className="comment-text">{c.text}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="comment-composer">
        <textarea
          rows={2}
          placeholder={`Comment as ${currentActor}…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handlePost} disabled={posting || !text.trim()}>
          {posting ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}
