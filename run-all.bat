@echo off
echo ======================================================================
echo           TMDS: Tampering Medical Databases ^& Related Security
echo ======================================================================
echo.

:: Start Backend
echo [1/3] Launching Node.js Express API Server on http://localhost:5000...
start "TMDS Backend" cmd /c "cd backend && npm run start"

:: Start Frontend
echo [2/3] Launching Vite React Client on http://localhost:3000...
start "TMDS Frontend" cmd /c "cd frontend && npm run dev"

:: Python AI instructions
echo [3/3] Python AI module is set up in the 'ai-module/' directory.
echo       To launch the AI module, open a terminal and execute:
echo       cd ai-module
echo       pip install -r requirements.txt
echo       python app.py
echo.
echo ======================================================================
echo SUCCESS: Services launched! Press any key to close this launcher.
echo ======================================================================
pause > nul
