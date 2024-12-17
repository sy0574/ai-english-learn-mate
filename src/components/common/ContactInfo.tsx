import { useState } from 'react';

const ContactInfo = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Contact Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-primary hover:bg-primary-dark text-white rounded-full p-3 shadow-lg transition-all duration-300 flex items-center space-x-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>让Carl老师帮我加功能</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Learn Mate AI独立开发者&英语老师👇🏻</h3>
              <div className="w-64 h-64 mx-auto">
                <img
                  src="/images/contact/wechat-contact.jpg"
                  alt="WeChat QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="mt-4 text-gray-600">Carl本人，非诚勿扰</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactInfo;
