'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Menu, X, Sparkles } from 'lucide-react';
import styles from './Navbar.module.css';

const navItems = [
  { href: '/', label: '首頁' },
  { href: '/plan', label: '路線規劃' },
  { href: '/map', label: '地圖' },
  { href: '/saved', label: '收藏' },
  { href: '/about', label: '關於' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <Shield size={18} />
          </div>
          <span className={styles.logoText}>NightSafe</span>
        </Link>

        <div className={styles.navLinks}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${pathname === item.href ? styles.active : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className={styles.ctaButton}>
          <Link href="/plan" className="btn btn-primary btn-sm" onClick={() => setMobileOpen(false)}>
            <Sparkles size={14} />
            開始分析
          </Link>
        </div>

        <button
          className={styles.mobileMenuBtn}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? '關閉選單' : '開啟選單'}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <div className={`${styles.mobileMenu} ${mobileOpen ? styles.open : ''}`}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.mobileNavLink} ${pathname === item.href ? styles.active : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <Link href="/plan" className="btn btn-primary" style={{ marginTop: '8px' }} onClick={() => setMobileOpen(false)}>
          <Sparkles size={14} />
          開始分析
        </Link>
      </div>
    </>
  );
}
