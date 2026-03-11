import React from "react";
import "./Hero.css";
// import heroImage from "./hero-image.png"; // replace with your image path

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Welcome to Grace</h1>
        <p>Smart Electronics for Modern Life</p>
        <h3 className="hero-btn">Shop Now</h3>
      </div>
      <div className="hero-image">
        {/* <img src={heroImage} alt="Electronics Illustration" /> */}
      </div>
    </section>
  );
};

export default Hero;
