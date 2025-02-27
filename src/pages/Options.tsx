import React from 'react';
import Settings from '../components/Settings';
import Layout from '../components/Layout';

const Options: React.FC = () => {
  return (
    <Layout>
      <div className="p-4">
        <Settings />
      </div>
    </Layout>
  );
};

export default Options; 