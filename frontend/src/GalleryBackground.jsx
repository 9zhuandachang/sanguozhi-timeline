import React, { useState, useEffect } from 'react';

const images = [
  "004ffa773912b31bbbb50b01c018367adbb4e104.jpg",
  "05cb1836acaf2eddd37c80c1cb1001e938019348.jpg",
  "258cc158d109b3de30333e408abf6c81810a4c49.jpg",
  "31658a33c895d14340a8220b35f082025baf077b.jpg",
  "34795727_p0.jpg",
  "39369b741f80460d9328287b4aa65450.jpg",
  "3952a503738da97730f64003f651f8198718e304.jpg",
  "438c761f95cad1c81837260f393e6709c83d5149.jpg",
  "63fa0043fbf2b211fa2b40668c8065380dd78ed0.jpg",
  "72ff8753fe3e4bd5a7569ee0d4a144a3.jpg",
  "7ce611a7d933c8953da05e53971373f08302007b.jpg",
  "9ae6eb99a9014c084ee2ee8d4c7b02087af4f404.jpg",
  "a40bb5d7e8e146cc880eeb3fb7cf8957.jpg",
  "a4e83359252dd42a7f0cc483453b5bb5c8eab8d0.jpg",
  "b82d25094b36acaf416d5fd43ad98d1000e99c48.jpg",
  "bb578243ad4bd1139c13711a1cafa40f4afb057b.jpg",
  "cb5bfa014c086e063c71f96344087bf40bd1cb04.jpg",
  "d00e2fd98d1001e9b8aece27fe0e7bec55e7974f.jpg",
  "d00e2fd98d1001e9b939d127fe0e7bec55e797d0.jpg",
  "db11ae1f4134970a8bffca07d3cad1c8a6865d49.jpg",
  "df6d7ddda3cc7cd9f328f1f17f01213fb90e91d0.jpg",
  "eed4aefaaf51f3de233e634cd2eef01f3b297949.jpg",
  "f149f51ea8d3fd1ff8857812764e251f94ca5f49.jpg",
  "QAofc92uWQsNqkhL.png"
];

export const GalleryBackground = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Change image every 8 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="gallery-background">
      {images.map((img, index) => (
        <div
          key={img}
          className={`gallery-image ${index === currentIndex ? 'active' : ''}`}
          style={{ backgroundImage: `url('/gallery/${img}')` }}
        />
      ))}
      {/* Heavy dark overlay so the timeline text stays readable */}
      <div className="gallery-overlay"></div>
    </div>
  );
};
