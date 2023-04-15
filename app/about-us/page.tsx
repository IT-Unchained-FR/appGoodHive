"use client";

import { NavBar } from "../components/nav-bar";
import { Rainbowkit } from "../components/rainbowkit";

export default function AboutUs() {
  return (
    <Rainbowkit>
      <NavBar />
      <main className="mx-5">
        <h1 className="my-5 text-2xl">About Us</h1>
      </main>
    </Rainbowkit>
  );
}
