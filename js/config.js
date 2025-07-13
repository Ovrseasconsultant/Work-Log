// Configuration constants
const FORMSPREE_URL = "https://formspree.io/f/xwpbgyep";
const STORAGE_KEY = "workLogDataV8";

// App state
let allSessions = [];
let hourlyRate = 0;
let currentDate = new Date().toISOString().slice(0, 10);
let sessionToDelete = null;
let sessionToEdit = null;
