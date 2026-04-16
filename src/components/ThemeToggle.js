import React, { useState } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';

export default function ThemeToggle() {
  const [dark, setDark] = useState(
    () => (localStorage.getItem('suprs-theme') || 'dark') === 'dark'
  );

  const toggle = () => {
    const next = dark ? 'light' : 'dark';
    setDark(!dark);
    localStorage.setItem('suprs-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <button onClick={toggle} className="btn-icon" title="Toggle theme"
      style={{ width:38, height:38 }}>
      {dark
        ? <FaSun size={15} color="#f59e0b" />
        : <FaMoon size={15} color="#8b5cf6" />}
    </button>
  );
}