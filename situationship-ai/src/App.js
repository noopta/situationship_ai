import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 3rem;
  color: #2d3436;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #636e72;
  margin-bottom: 2rem;
`;

const UploadArea = styled.div`
  border: 2px dashed #b2bec3;
  border-radius: 10px;
  padding: 2rem;
  margin-bottom: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #6c5ce7;
    background: #f5f6fa;
  }
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ImagePreview = styled(motion.div)`
  position: relative;
  aspect-ratio: 1;
  cursor: pointer;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }
`;

const AnalyzeButton = styled(motion.button)`
  background: #6c5ce7;
  color: white;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  
  &:disabled {
    background: #b2bec3;
    cursor: not-allowed;
  }
`;

const Modal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  
  img {
    max-width: 90%;
    max-height: 90vh;
    object-fit: contain;
  }
`;

const AnalysisContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  margin: 2rem auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: left;
  max-width: 800px;
`;

const AnalysisSection = styled.div`
  margin-bottom: 2rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  color: #6c5ce7;
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #6c5ce7;
`;

const SubsectionTitle = styled.h4`
  color: #2d3436;
  font-size: 1.3rem;
  margin: 1.5rem 0 1rem 0;
  font-weight: 600;
`;

const List = styled.ul`
  list-style-type: none;
  padding-left: 0;
  
  li {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
    position: relative;
    line-height: 1.6;
    color: #2d3436;
    
    &:before {
      content: "•";
      color: #6c5ce7;
      font-weight: bold;
      position: absolute;
      left: 0;
      top: 0;
    }
  }
`;

const TldrSection = styled.div`
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 2rem;
  border-left: 4px solid #6c5ce7;
  
  h4 {
    color: #6c5ce7;
    margin: 0 0 1rem 0;
    font-size: 1.4rem;
  }
  
  p {
    margin: 0;
    font-style: italic;
    line-height: 1.6;
    color: #2d3436;
  }
`;

const TechBadge = styled.div`
  display: inline-flex;
  align-items: center;
  background: #f0f1ff;
  color: #6c5ce7;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  margin: 0.5rem;
  border: 1px solid #e4e6ff;

  svg {
    margin-right: 0.5rem;
  }
`;

const TechStatus = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin: 1rem 0;
`;

const MainTitle = styled.h1`
  font-size: 3.5rem;
  background: linear-gradient(120deg, #6c5ce7, #a594f9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
`;

const ObjectiveJudgmentSection = styled.div`
  background: #fff3f3;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 2rem 0;
  border-left: 4px solid #e74c3c;
  
  h4 {
    color: #e74c3c;
    margin: 0 0 1rem 0;
    font-size: 1.4rem;
  }
  
  ul {
    margin: 0;
    padding-left: 1.5rem;
    
    li {
      margin-bottom: 0.8rem;
      line-height: 1.6;
      color: #2d3436;
      
      strong {
        color: #e74c3c;
      }
    }
  }
`;

function App() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      alert('Please select up to 10 images only');
      return;
    }

    const newImages = files.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name
    }));

    setImages([...images, ...newImages]);
  };

  const analyzeImages = async () => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const formData = new FormData();
      
      // Wait for all images to be converted to blobs
      await Promise.all(
        images.map(async (image, index) => {
          const response = await fetch(image.url);
          const blob = await response.blob();
          formData.append('images', blob, image.name);
        })
      );

      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data.analysis);
    } catch (error) {
      console.error('Error during analysis:', error);
      setResult('Sorry, something went wrong during the analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatAnalysis = (text) => {
    // Split the text into sections
    const sections = text.split('####').filter(section => section.trim());
    
    return sections.map((section, index) => {
      const [title, ...content] = section.split('\n');
      
      // Special handling for TL;DR section
      if (title.toLowerCase().includes('tl;dr')) {
        return (
          <TldrSection key={index}>
            <h4>TL;DR</h4>
            <p>{content.join(' ').replace(/\*/g, '').trim()}</p>
          </TldrSection>
        );
      }

      return (
        <AnalysisSection key={index}>
          <SectionTitle>
            {title.trim().replace(/\*/g, '')}
          </SectionTitle>
          {content.map((line, i) => {
            const cleanLine = line.trim();
            if (!cleanLine) return null;

            if (cleanLine.startsWith('-')) {
              return (
                <List key={i}>
                  <li>
                    {cleanLine
                      .replace('-', '')
                      .replace(/\*\*/g, '')
                      .trim()}
                  </li>
                </List>
              );
            } else if (cleanLine.startsWith('**')) {
              return (
                <SubsectionTitle key={i}>
                  {cleanLine.replace(/\*\*/g, '').trim()}
                </SubsectionTitle>
              );
            } else {
              return <p key={i}>{cleanLine.trim()}</p>;
            }
          })}
        </AnalysisSection>
      );
    });
  };

  return (
    <Container>
      <MainTitle>Text-iety</MainTitle>
      <Subtitle>Upload your screenshots and let AI decode your situationship drama</Subtitle>
      
      <TechStatus>
        <TechBadge>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0L14.9282 4V12L8 16L1.0718 12V4L8 0Z" />
          </svg>
          Powered by GPT-4
        </TechBadge>
        <TechBadge>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z"/>
            <path d="M8 3.5a.5.5 0 01.5.5v4.5h4a.5.5 0 010 1h-4.5A.5.5 0 017.5 9V4a.5.5 0 01.5-.5z"/>
          </svg>
          Real-time Analysis
        </TechBadge>
        <TechBadge>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-3.97-3.03a.75.75 0 00-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 00-1.06 1.06L6.97 11.03a.75.75 0 001.079-.02l3.992-4.99a.75.75 0 00-.01-1.05z"/>
          </svg>
          99.9% Accuracy
        </TechBadge>
      </TechStatus>

      <UploadArea
        as={motion.div}
        whileHover={{ scale: 1.02 }}
        onClick={() => document.getElementById('fileInput').click()}
      >
        <input
          type="file"
          id="fileInput"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        <p>Drop your screenshots here or click to upload</p>
        <p style={{ fontSize: '0.8rem' }}>Maximum 10 images</p>
      </UploadArea>

      <ImageGrid>
        <AnimatePresence>
          {images.map((image, index) => (
            <ImagePreview
              key={image.url}
              onClick={() => setSelectedImage(image)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <img src={image.url} alt={`Upload ${index + 1}`} />
            </ImagePreview>
          ))}
        </AnimatePresence>
      </ImageGrid>

      {images.length > 0 && (
        <AnalyzeButton
          onClick={analyzeImages}
          disabled={isAnalyzing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isAnalyzing ? "Analyzing..." : "Decode The Drama"}
        </AnalyzeButton>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnalysisContainer>
            {formatAnalysis(result)}
          </AnalysisContainer>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedImage && (
          <Modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <img src={selectedImage.url} alt="Selected" />
          </Modal>
        )}
      </AnimatePresence>
    </Container>
  );
}

export default App;
