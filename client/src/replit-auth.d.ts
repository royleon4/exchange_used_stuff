// Type declarations for the Replit Auth script (https://auth.util.repl.co/script.js)
declare interface Window {
  LoginWithReplit?: () => void;
  __replitAuthed?: boolean;
}
