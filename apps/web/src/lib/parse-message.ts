/**
 * Parses structured markers from assistant messages.
 *
 * The agents use these markers to communicate actionable UI elements:
 * - ---OPTIONS--- ... ---END_OPTIONS---  → Quick-reply buttons
 * - ---ESCALATE--- ... ---END_ESCALATE--- → Human support handoff banner
 *
 * The regexes are intentionally flexible to handle local model variations
 * (extra dashes, spaces, missing underscores, etc.)
 */

export interface ParsedMessage {
    /** The cleaned message content (markers stripped) */
    content: string;
    /** Quick-reply options extracted from ---OPTIONS--- block */
    options: string[];
    /** Escalation message extracted from ---ESCALATE--- block */
    escalationMessage: string | null;
}

// Flexible regexes: tolerate variable dashes (2+), optional underscores/spaces
const OPTIONS_REGEX = /-{2,}\s*OPTIONS\s*-{2,}\s*([\s\S]*?)\s*-{2,}\s*END[\s_]*OPTIONS\s*-{2,}/i;
const ESCALATE_REGEX = /-{2,}\s*ESCALATE\s*-{2,}\s*([\s\S]*?)\s*-{2,}\s*END[\s_]*ESCALATE\s*-{2,}/i;

/**
 * Cleans a single option line: strips leading numbering (1., 2.), bullets (-, *),
 * and wrapping quotes/backticks that local models sometimes add.
 */
function cleanOptionLine(line: string): string {
    return line
        .replace(/^\d+[.)]\s*/, '')    // "1. Option" → "Option"
        .replace(/^[-*•]\s*/, '')      // "- Option" → "Option"
        .replace(/^["'`]+|["'`]+$/g, '') // strip wrapping quotes
        .trim();
}

export function parseMessageMarkers(rawContent: string): ParsedMessage {
    let content = rawContent;
    let options: string[] = [];
    let escalationMessage: string | null = null;

    // Extract options
    const optionsMatch = content.match(OPTIONS_REGEX);
    if (optionsMatch) {
        const optionsBlock = optionsMatch[1].trim();
        options = optionsBlock
            .split("\n")
            .map((line) => cleanOptionLine(line))
            .filter((line) => line.length > 0);
        content = content.replace(OPTIONS_REGEX, "").trim();
    }

    // Extract escalation message
    const escalateMatch = content.match(ESCALATE_REGEX);
    if (escalateMatch) {
        escalationMessage = escalateMatch[1].trim();
        content = content.replace(ESCALATE_REGEX, "").trim();
    }

    return { content, options, escalationMessage };
}

