import React from 'react';
import Header from '../ui/components/Header';
import LoginButton from '../ui/components/LoginButton';
import carImage from '/carImage.png';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <>
      <Header />
      <div
        className="m-0 p-0 h-screen"
        style={{
          backgroundImage: `url(${carImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '105vh',
          placeContent: 'center',
          justifyItems: 'center',
          textAlign: 'center',
          zIndex: '100',
        }}
      >
        <LoginButton />

        <div
          style={{
            backgroundColor: 'rgba(217, 217, 217, 0.6)',
            borderRadius: '20px',
            width: '600px',
            marginTop: '-180px',
          }}
        >
          <div>
            <h1 className="text-[48px]">Welcome to</h1>
            <h1 className="text-[72px]">J&A Car Rental</h1>
          </div>
        </div>
        <div>
          <h1
            className="text-[96px] text-[#F13F3F]"
            style={{
              fontStyle: 'italic',
              textShadow: '2px 2px 0 rgba(255,255,255,1)',
              position: 'absolute',
              left: '120px',
              bottom: '20px',
            }}
          >
            Let's get you
          </h1>
          <h1
            className="text-[96px] text-[#F13F3F]"
            style={{
              fontStyle: 'italic',
              textShadow: '2px 2px 0 rgba(255,255,255,1)',
              position: 'absolute',
              right: '210px',
              bottom: '-80px',
            }}
          >
            on the ROAD
          </h1>
          <Link to="/admin/dashboard">
            <button
              style={{
                fontStyle: 'italic',
                position: 'absolute',
                right: '110px',
                bottom: '0',
                marginTop: '55px',
                border: 'none',
                borderRadius: '20px',
                padding: '5px',
                cursor: 'pointer',
              }}
            >
              Book Now →
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
