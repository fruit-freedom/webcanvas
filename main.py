from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/api/inspections/{inspection_id}/tasks/{task_id}/violations/{violation_id}/images')
async def get_violation_images(inspection_id: int, task_id: int, violation_id: int):
    pass

@app.get('/api/tasks/{task_id}/media-files/{media_file_id}/chains/{chain_id}')
async def get_results(task_id: int, media_file_id: int, chain_id: int):
    return [
        {
            "type": "JSON",
            "algorithm_name": "waste_fraction_segmentor"
        },
        {
            "type": "PNGMask",
            "algorithm_name": "postprocessing-circles"
        },
        {
            "type": "PNGMask",
            "algorithm_name": "postprocessing-rain"
        }
    ]

@app.get('/api/tasks/{task_id}/media-files/{media_file_id}/results/{algorithm_name}')
async def get_result(task_id: int, media_file_id: int, algorithm_name: str):
    if algorithm_name == 'postprocessing-circles':
        return FileResponse('src/mask_1.jpg')
    elif algorithm_name == 'postprocessing-rain':
        return FileResponse('src/mask_2.png')
    else:
        return {

        }
