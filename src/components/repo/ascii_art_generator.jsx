import React, { useEffect, useState } from "react";
import figlet from "figlet";
import bannerFont from "figlet/importable-fonts/Banner.js";
import blockFont from "figlet/importable-fonts/Block.js";
import bubbleFont from "figlet/importable-fonts/Bubble.js";
import digitalFont from "figlet/importable-fonts/Digital.js";
import leanFont from "figlet/importable-fonts/Lean.js";
import miniFont from "figlet/importable-fonts/Mini.js";
import shadowFont from "figlet/importable-fonts/Shadow.js";
import slantFont from "figlet/importable-fonts/Slant.js";
import speedFont from "figlet/importable-fonts/Speed.js";
import standardFont from "figlet/importable-fonts/Standard.js";
import { Grid3X3, X } from "lucide-react";

const ASCII_STYLES = [
  { label: "Standard", font: "Standard" },
  { label: "Banner", font: "Banner" },
  { label: "Block", font: "Block" },
  { label: "Bubble", font: "Bubble" },
  { label: "Digital", font: "Digital" },
  { label: "Lean", font: "Lean" },
  { label: "Mini", font: "Mini" },
  { label: "Shadow", font: "Shadow" },
  { label: "Slant", font: "Slant" },
  { label: "Speed", font: "Speed" }
];

const FIGLET_FONT_DATA = {
  Banner: bannerFont,
  Block: blockFont,
  Bubble: bubbleFont,
  Digital: digitalFont,
  Lean: leanFont,
  Mini: miniFont,
  Shadow: shadowFont,
  Slant: slantFont,
  Speed: speedFont,
  Standard: standardFont
};

let figletFontsLoaded = false;

function ensureFigletFontsLoaded() {
  if (figletFontsLoaded) return;

  Object.entries(FIGLET_FONT_DATA).forEach(([fontName, fontData]) => {
    figlet.parseFont(fontName, fontData);
  });
  figletFontsLoaded = true;
}

export default function AsciiArtGenerator({ open, onClose, onInsert }) {
  const [inputText, setInputText] = useState("");
  const [selectedFont, setSelectedFont] = useState("Standard");
  const [asciiOutput, setAsciiOutput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const text = inputText.trim();
    setError("");

    if (!text) {
      setAsciiOutput("Type something to preview ASCII art.");
      return;
    }

    let cancelled = false;
    ensureFigletFontsLoaded();

    figlet.text(text, { font: selectedFont }, (figletError, result) => {
      if (cancelled) return;
      if (figletError) {
        setError("This style could not render that text. Try another style.");
        setAsciiOutput("");
        return;
      }
      setAsciiOutput(result || "");
    });

    return () => {
      cancelled = true;
    };
  }, [inputText, open, selectedFont]);

  useEffect(() => {
    if (!open) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;

  function insertAsciiArt() {
    if (!asciiOutput || !inputText.trim() || error) return;
    onInsert(`\n\n\`\`\`\n${asciiOutput}\n\`\`\`\n\n`);
    onClose();
  }

  return (
    <div className="ascii-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="ascii-modal" role="dialog" aria-modal="true" aria-labelledby="ascii-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="ascii-modal-header">
          <div>
            <p className="eyebrow">Repo notes</p>
            <h2 id="ascii-modal-title"><Grid3X3 size={18} /> Insert ASCII art</h2>
          </div>
          <button aria-label="Close ASCII art generator" onClick={onClose} type="button"><X size={18} /></button>
        </div>

        <label className="ascii-field">
          Text to convert
          <input
            autoFocus
            onChange={(event) => setInputText(event.target.value)}
            placeholder="Type something..."
            value={inputText}
          />
        </label>

        <div className="ascii-field">
          <span>Style</span>
          <div className="ascii-style-row" role="listbox" aria-label="ASCII art style">
            {ASCII_STYLES.map((style) => (
              <button
                aria-selected={selectedFont === style.font}
                className={selectedFont === style.font ? "selected" : ""}
                key={style.font}
                onClick={() => setSelectedFont(style.font)}
                type="button"
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ascii-field">
          <span>Live preview</span>
          <pre className="ascii-preview">{error || asciiOutput}</pre>
        </div>

        <div className="ascii-modal-actions">
          <button className="ascii-cancel" onClick={onClose} type="button">Cancel</button>
          <button className="ascii-insert" disabled={!inputText.trim() || !asciiOutput || Boolean(error)} onClick={insertAsciiArt} type="button">
            Insert into note
          </button>
        </div>
      </section>
    </div>
  );
}
