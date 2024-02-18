import React from 'react';
import './App.css';
import { useContext, useEffect, useRef, useState } from 'react';

import { RadioGroup, FormControlLabel, Radio, Typography } from '@mui/material';

import sourceImageUrl from './image.jpeg'
import otherSourceImageUrl from './image.png'

import metadaMask1 from './mask_1.jpg'
import metadaMask2 from './mask_2.png'

class Drawable {
    constructor(draw) {
        this.draw = draw;
    }

    draw(ctx) {
        return this.draw(ctx);
    }
};

const CanvasRederer = ({ baseImage, maskImage }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !baseImage)
            return;

        const ctx = canvasRef.current.getContext('2d');
        ctx.globalAlpha = 1.0;
        ctx.clearRect(0, 0, 1000, 1000);
        ctx.drawImage(baseImage, 0, 0, 800, 400);

        ctx.globalAlpha = 0.4;
        if (maskImage) {
            console.log('typeof maskImage', typeof maskImage)
            if (maskImage instanceof Drawable) {
                maskImage.draw(ctx);
            }
            else {
                ctx.drawImage(maskImage, 0, 0, 800, 400);
            }
        }
    }, [canvasRef.current, baseImage, maskImage]);

    return (
        // <div style={{ border: '1px solid grey' }}>
        <div>
            <canvas height={400} width={800} ref={canvasRef}></canvas>
        </div>
    )
};

const loadMetadata = async (metaDescription) => {
    const algorithmName = metaDescription.algorithm_name;
    const response = await fetch(`http://localhost:8000/api/tasks/1/media-files/1/results/${algorithmName}`);

    console.log('metaDescription.type', metaDescription.type)
    if (metaDescription.type == 'PNGMask') {
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        return { image: bitmap, algorithmName };
    }
    else {
        const body = await response.json();
        // const bitmap = await createImageBitmap(blob);
        // return { image: bitmap, algorithmName };
        return { algorithmName, image: new Drawable((ctx) => {
            const region = new Path2D();
            region.moveTo(30, 90);
            region.lineTo(110, 20);
            region.lineTo(240, 130);
            region.lineTo(60, 130);
            region.lineTo(190, 20);
            region.lineTo(270, 90);
            region.closePath();

            // Fill path
            ctx.fillStyle = "green";
            ctx.fill(region, "evenodd");
        })};
    }
}

const loadImageMetadata = async (imagmetadataFilter) => {
    const taskId = imagmetadataFilter.taskId;
    const mediaFileId = imagmetadataFilter.mediaFileId;
    const violationCode = imagmetadataFilter.violationCode;
    const metalistResponse = await fetch(`http://localhost:8000/api/tasks/${taskId}/media-files/${mediaFileId}/chains/${violationCode}`);
    const metaDescriptions = await metalistResponse.json();
    return await Promise.all(metaDescriptions.map(description => loadMetadata(description)));
};

const MetadataRenderer = ({ metadataFilter, image, onNextImage, onPrevImage }) => {
    const [metadata, setMetadata] = useState([]);
    const [currentMetadataIdx, setCurrentMetadataIdx] = useState(-1);
    const [radioGroupKey, setRadioGroupKey] = useState(0);

    useEffect(() => {
        if (!image)
            return;

        setMetadata([]);
        setCurrentMetadataIdx(-1);
        setRadioGroupKey(prevKey => prevKey + 1);

        /// Loading and decoding metadata
        console.log('metadataFilter', metadataFilter)
        loadImageMetadata(metadataFilter)
        .then(metadata => setMetadata(metadata));

        console.log('Loading meta....');
    }, [image])

    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <div
                    onClick={onPrevImage}
                    className='slider-control-button'
                    style={{ left: '0' }}
                >
                </div>
                <CanvasRederer baseImage={image} maskImage={currentMetadataIdx >= 0 ? metadata[currentMetadataIdx].image : null}/>
                <div
                    onClick={onNextImage}
                    className='slider-control-button'
                    style={{ right: '0' }}
                >
                </div>
            </div>
            <div style={{ padding: '20px' }}>
                <Typography>Результаты алгоритмов</Typography>
                <RadioGroup
                    defaultValue="-1"
                    onChange={e => setCurrentMetadataIdx(+e.target.value)}
                    key={radioGroupKey}
                >
                    <FormControlLabel value="-1" control={<Radio />} label="Исходное изображение" />
                    {
                        metadata.map((m, idx) => (
                            <FormControlLabel key={idx} value={idx} control={<Radio />} label={m.algorithmName} />
                        ))
                    }
                </RadioGroup>
            </div>
        </div>
    )
};

const Slider = ({ images, taskId, chainId, violationCode }) => {
    const [currentIdx, setCutrrentIdx] = useState(0);
    const [image, setImage] = useState(null);

    useEffect(() => {
        const image = new window.Image();
        image.src = images[currentIdx].url;
        image.onload = e => setImage(image);
        console.log('Loading image....');
    }, [currentIdx])

    const onNextPage = () => setCutrrentIdx(idx => idx < images.length - 1 ? (idx + 1) : idx);
    const onPrevPage = () => setCutrrentIdx(idx => idx > 0 ? (idx - 1) : 0);

    return (
        <div>
            <MetadataRenderer
                metadataFilter={{ taskId, chainId, violationCode, mediaFileId: images[currentIdx].mediaFileId }}
                image={image}
                onNextImage={onNextPage}
                onPrevImage={onPrevPage}
            />
            <div style={{ padding: '10px', float: 'left' }}>
                <span>{currentIdx + 1}</span>/<span>{images.length}</span>
            </div>
        </div>
    )
};

function App() {
    const images = [
        {
            url: sourceImageUrl,
            mediaFileId: 1,
        },
        {
            url: otherSourceImageUrl,
            mediaFileId: 2,
        }
    ]

    return (
        <div className="App">
            <Slider taskId={1} chainId={1} violationCode={1} images={images}/>
        </div>
    );
}

export default App;
