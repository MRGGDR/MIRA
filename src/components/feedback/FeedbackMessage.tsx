import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export type FeedbackMessageState = {
  type: 'success' | 'error';
  title: string;
  message: string;
};

export function FeedbackMessage({ type, title, message }: FeedbackMessageState) {
  const Icon = type === 'success' ? CheckCircle2 : AlertTriangle;

  return (
    <div className={`feedback-message feedback-message--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span className="feedback-message__icon">
        <Icon aria-hidden size={20} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}
