/**
 * js/storage.js
 * Manages game state and settings serialization & deserialization in LocalStorage.
 * This ensures that active sessions, settings, and player colors are safely preserved.
 */

const SAVE_KEY = 'minimalist_chess_save';
const SETTINGS_KEY = 'minimalist_chess_settings';

export class StorageManager {
  /**
   * Serializes the complete game state, including standard board structures,
   * difficulty setup, color options, and history logs.
   */
  static saveGame(game, aiDifficulty, playerColor, gameMode) {
    try {
      const payload = {
        board: game.board,
        turn: game.turn,
        castlingRights: game.castlingRights,
        enPassantTarget: game.enPassantTarget,
        halfmoveClock: game.halfmoveClock,
        fullmoveNumber: game.fullmoveNumber,
        positionHistory: game.positionHistory,
        // Convert history states safely
        history: game.history,
        redoStack: game.redoStack,
        // Game settings meta
        aiDifficulty,
        playerColor,
        gameMode
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save game state to LocalStorage:', e);
    }
  }

  /**
   * Retrieves any existing saved chess session
   */
  static loadGame() {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load game state from LocalStorage:', e);
      return null;
    }
  }

  /**
   * Clears saved game on game resets or explicit over-writes
   */
  static clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      console.error('Failed to clear saved session:', e);
    }
  }

  /**
   * Checks if an active saved game exists
   */
  static hasSavedGame() {
    return !!localStorage.getItem(SAVE_KEY);
  }

  /**
   * Saves UI and application level settings
   */
  static saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  /**
   * Loads or returns default settings
   */
  static loadSettings() {
    const defaults = {
      soundEnabled: true,
      boardTheme: 'classic'
    };
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) return defaults;
      return { ...defaults, ...JSON.parse(data) };
    } catch (e) {
      console.error('Failed to load settings:', e);
      return defaults;
    }
  }
}

export default StorageManager;
