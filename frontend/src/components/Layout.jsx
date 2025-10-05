import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <Outlet /> {/* This will render the matched child route */}
      </main>
      <Footer />
    </>
  );
}