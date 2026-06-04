import React from 'react';
import './about.css';
import marsImage from '../../assests/mars.png';
import mobileImage from '../../assests/mobile-mars.png';

function About() {
  return (
    <div
      className="impact-container"
      style={{ backgroundImage: `url(${window.innerWidth <= 767 ? mobileImage : marsImage})` }}
    >
      <div className="mars-con" />

      <div className="cards-con">
        {/* Card 1 */}
        <div className="cards">
          <h3 className="impact-title">01. Igniting Creative Thinking</h3>
          <p className="impact-description">
            Students transform ideas into real-world solutions by working on innovative projects that solve practical problems and encourage original thinking and creativity.
          </p>
        </div>

        {/* Card 2 */}
        <div className="cards">
          <h3 className="impact-title">02.Shaping Career-Ready Professionals</h3>
          <p className="impact-description">
            Participants gain hands-on experience, industry exposure, and technical skills that help them secure internships, placements, and long-term career opportunities.
          </p>
        </div>

        {/* Card 3 */}
        <div className="cards">
          <h3 className="impact-title">03. Driving Positive Social Impact</h3>
          <p className="impact-description">
            Student initiatives focus on solving real societal challenges, improving lives, promoting sustainability, and creating meaningful change within communities.
          </p>
        </div>

        {/* Card 4 */}
        <div className="cards">
          <h3 className="impact-title">04. Strengthening Industry Connections</h3>
          <p className="impact-description">
            The program connects students with professionals and organizations, offering mentorship, internships, and collaborative opportunities that bridge academia and industry.
          </p>
        </div>
      </div>
    </div>
  );
}

export default About;
