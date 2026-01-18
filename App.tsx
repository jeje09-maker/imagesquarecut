
import React, { useState, useCallback, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Crop, 
  Download, 
  RefreshCcw, 
  Scissors,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Button from './components/Button';
import { Area } from './types';
import { getCroppedImg, createImage, getMinSideLength } from './utils/imageUtils';

// This is a simple implementation of a cropping interface.
// For a production app, we would use a library like 'react-easy-crop', 
// but we'll build a custom lightweight one to showcase the "min side length" logic.

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setCroppedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const reset = () => {
    setImageSrc(null);
    setCroppedImage(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAutoCrop = async () => {
    if (!imageSrc) return;
    
    setIsProcessing(true);
    try {
      const img = await createImage(imageSrc);
      const minSide = getMinSideLength(img);
      
      // Calculate coordinates to center the square
      const startX = (img.width - minSide) / 2;
      const startY = (img.height - minSide) / 2;

      const pixelCrop: Area = {
        x: startX,
        y: startY,
        width: minSide,
        height: minSide,
      };

      const croppedResult = await getCroppedImg(imageSrc, pixelCrop);
      setCroppedImage(croppedResult);
    } catch (err) {
      console.error(err);
      setError('Failed to process image. Please try another one.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!croppedImage) return;
    const link = document.createElement('a');
    link.href = croppedImage;
    link.download = 'square-crop.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="w-full max-w-4xl mb-10 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
            <Scissors className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          SquareCut
        </h1>
        <p className="text-lg text-slate-600 max-w-lg mx-auto">
          완벽한 정사각형 크롭. 원본 이미지의 짧은 변을 기준으로 고화질 이미지를 생성합니다.
        </p>
      </header>

      <main className="w-full max-w-2xl">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {!imageSrc ? (
          /* Upload State */
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group relative border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all duration-300"
          >
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept="image/*" 
              onChange={onFileChange} 
            />
            <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-indigo-100 transition-colors duration-300">
              <Upload className="w-10 h-10 text-slate-400 group-hover:text-indigo-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">이미지 업로드</h3>
            <p className="text-slate-500">여기를 클릭하거나 파일을 드래그하여 시작하세요</p>
          </div>
        ) : (
          /* Processing/Result State */
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-300">
            <div className="p-6">
              <div className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center">
                {croppedImage ? (
                  <img src={croppedImage} alt="Cropped" className="w-full h-full object-cover" />
                ) : (
                  <img src={imageSrc} alt="Preview" className="max-w-full max-h-full object-contain" />
                )}
                
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <RefreshCcw className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                    <span className="font-medium text-indigo-900">이미지 가공 중...</span>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col gap-4">
                {!croppedImage ? (
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="w-full py-4 text-lg" 
                    onClick={handleAutoCrop}
                    disabled={isProcessing}
                    icon={<Crop className="w-5 h-5" />}
                  >
                    정사각형으로 자르기
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      variant="primary" 
                      size="lg" 
                      className="flex-1 py-4" 
                      onClick={downloadImage}
                      icon={<Download className="w-5 h-5" />}
                    >
                      이미지 다운로드
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="lg" 
                      className="flex-1 py-4" 
                      onClick={reset}
                      icon={<RefreshCcw className="w-5 h-5" />}
                    >
                      다른 이미지 선택
                    </Button>
                  </div>
                )}
                
                {croppedImage && (
                  <div className="flex items-center justify-center text-emerald-600 text-sm font-medium mt-2">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    성공적으로 잘렸습니다!
                  </div>
                )}
                
                {!croppedImage && (
                  <Button 
                    variant="ghost" 
                    className="w-full" 
                    onClick={reset}
                    disabled={isProcessing}
                  >
                    취소
                  </Button>
                )}
              </div>
            </div>
            
            {/* Specs Footer */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-between text-xs text-slate-400 font-medium">
              <div className="flex items-center">
                <ImageIcon className="w-3.5 h-3.5 mr-1" />
                Original Quality
              </div>
              <div className="flex items-center">
                <Scissors className="w-3.5 h-3.5 mr-1" />
                Smart Center Detection
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Instructions */}
      {!imageSrc && (
        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl text-center md:text-left">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4 mx-auto md:mx-0 font-bold">1</div>
            <h4 className="font-bold text-slate-800 mb-2">파일 업로드</h4>
            <p className="text-sm text-slate-500 leading-relaxed">자르고 싶은 어떤 크기의 이미지든 업로드하세요.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4 mx-auto md:mx-0 font-bold">2</div>
            <h4 className="font-bold text-slate-800 mb-2">스마트 분석</h4>
            <p className="text-sm text-slate-500 leading-relaxed">가로와 세로 중 더 짧은 변을 자동으로 찾아 정사각형을 만듭니다.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4 mx-auto md:mx-0 font-bold">3</div>
            <h4 className="font-bold text-slate-800 mb-2">저장</h4>
            <p className="text-sm text-slate-500 leading-relaxed">중앙 정렬된 완벽한 결과물을 다운로드하여 사용하세요.</p>
          </div>
        </section>
      )}

      <footer className="mt-auto py-8 text-slate-400 text-sm flex flex-col items-center gap-2">
        <p>&copy; 2024 SquareCut. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
