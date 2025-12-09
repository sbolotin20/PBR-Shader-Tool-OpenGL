# PBR Shader Tool — Real-Time Physically Based Rendering in OpenGL

This project is a real-time shader tool built in C++ and OpenGL, modeled after Unreal Engine’s *Principal Standard Shader*. It implements a complete Physically Based Rendering (PBR) pipeline with Image-Based Lighting (IBL) and provides an interactive viewer for testing 3D models and textures.

I built this tool from scratch to better understand how modern shading works under the hood — covering BRDF lighting, skybox generation, irradiance map convolution, mipmap-based reflections, and tangent-space normal mapping.

---

<img width="1443" height="566" alt="Screenshot 2025-12-07 134634" src="https://github.com/user-attachments/assets/53017619-46df-4abe-80a2-f179a06c6ceb" />

## Features

- Load any `.obj` model with **tinyobjloader**
- Upload PBR texture maps:
  - Base Color (Albedo)
  - Normal Map (Tangent-Space)
  - Roughness Map
  - Metallic Map
  - Ambient Occlusion Map
- Real-time lighting control:
  - Light direction, intensity, and color
- Full **IBL pipeline** using HDR skyboxes
  - Equirectangular → Cubemap conversion
  - Irradiance map convolution (diffuse)
  - Prefiltered reflections (specular)
- Adjustable material properties via **ImGui**
- Orbit camera with mouse controls (drag + scroll)
- Gamma correction and tone mapping

---

## Folder Structure
PBR-Shader-Tool/
│
├── /External/ # stb_image, tinyobjloader, ImGui, etc.
├── /shaders/ # .vert and .frag GLSL files
├── main.cpp # Core rendering loop and logic
├── texture_utils.cpp/.h # Texture loading, HDR loading, cubemap utils
├── mesh_utils.cpp/.h # OBJ loading, normal/tangent generation
├── shader_utils.cpp/.h # Shader compilation and uniform helpers
├── uniforms.h # Shared uniform locations / struct
├── assets/ # (Optional) HDR files and example textures
└── README.md


---

## Requirements

- C++17 compatible compiler
- OpenGL 3.3+
- [GLFW](https://www.glfw.org/)
- [GLAD](https://glad.dav1d.de/)
- stb_image
- tinyobjloader
- Dear ImGui

> The project is designed for Windows (Visual Studio), but can be adapted for Linux or Mac with minor changes.

---

## How to Run

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/PBR-Shader-Tool.git
cd PBR-Shader-Tool
```

### 2. Set Up Dependencies

All required dependencies are included in the /External/ folder, but ensure you have:

- OpenGL driver support
- Visual Studio or CMake + Make configured

### 3. Build & Run
**Option 1**: Visual Studio (recommended on Windows)
- Open Principal_Shader_Open_GL.vcxproj
- Set as StartUp Project
- Build → Run

**Option 2**: CMake
```bash
mkdir build && cd build
cmake ..
make
./PBR-Shader-Tool
```

### Loading Models & Textures
1. Launch the tool.
2. Use the ImGui panel on the left:
    - Click "Choose Object" to load any .obj file.
    - Load PBR texture maps via:
        - Load Base Color
        - Load Normal
        - Load Roughness
        - Load Metallic
        - Load AO
3. Adjust material sliders (roughness, metallic, base tint).
4. Toggle IBL to see environment reflections using the HDR cubemap.
5. Tweak light direction and intensity to test different lighting setups.

### What I Learned

This project helped me gain deep technical understanding of:
- PBR lighting models (Fresnel, GGX, Smith geometry)
- IBL theory and importance of convolved irradiance
- Real-time shader optimization and mipmap sampling
- Cross-domain workflows between OpenGL and real-time art
It’s built to showcase not just visual quality, but clarity in code and modular architecture — critical skills for any Technical Artist working at the rendering pipeline level.

### Demo Reel
https://vimeo.com/1144328422?share=copy&fl=sv&fe=ci

### Sources
Code Libraries
- [stb_image](https://github.com/nothings/stb)
- [tinyobjloader](https://github.com/nothings/stb)
- [Dear ImGui](https://github.com/ocornut/imgui)
Model Sources:
- By 3d-coat: https://sketchfab.com/3d-models/material-ball-in-3d-coat-a6bdf1d11d714e07b9dd99dda02de965
- By LemonadeCG: https://www.cgtrader.com/items/957239/download-page
