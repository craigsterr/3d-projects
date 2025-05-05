from PIL import Image
import sys
import math

def read_input_file(file_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()
    return lines



def dda_line(a, b, d):
    if a[d] == b[d]:
        return []
    
    if a[d] > b[d]:
        a, b = b, a
    
    delta = [b[i] - a[i] for i in range(len(a))]
    
    s = [delta[i] / delta[d] for i in range(len(a))]
    
    e = math.ceil(a[d]) - a[d]
    offset = [e * si for si in s]
    
    p = [a[i] + offset[i] for i in range(len(a))]
    
    points = []
    while p[d] < b[d]:
        points.append([round(pi) for pi in p])
        p = [p[i] + s[i] for i in range(len(p))]
    
    return points

def viewport_transform(x, y, z, width, height):
    x_vp = (x + 1) * 0.5 * width
    y_vp = (1 - y) * 0.5 * height
    z_vp = z
    
    return (x_vp, y_vp, z_vp)

def scanline_fill(vertices, color, pixels):
    vertices = sorted(vertices, key=lambda v: v[1])  # Sort by y-coordinate
    x0, y0 = vertices[0]
    x1, y1 = vertices[1]
    x2, y2 = vertices[2]

    for y in range(int(y0), int(y2) + 1):
        if y1 > y0:
            x_start = x0 + (y - y0) * (x1 - x0) / (y1 - y0)
        if y2 > y1:
            x_end = x1 + (y - y1) * (x2 - x1) / (y2 - y1)
        for x in range(int(x_start), int(x_end)):
            if 0 <= x < pixels.width and 0 <= y < pixels.height:
                pixels[x, y] = color

def draw_triangle(vertices, color, pixels):
    transformed_vertices = []
    for (x, y, z, w) in vertices:
        transformed_vertex = viewport_transform(x, y, z, pixels.width, pixels.height)
        transformed_vertices.append(transformed_vertex)

    
    dda_line(*transformed_vertices[0], *transformed_vertices[1], color, pixels)
    dda_line(*transformed_vertices[1], *transformed_vertices[2], color, pixels)
    dda_line(*transformed_vertices[2], *transformed_vertices[0], color, pixels)

    scanline_fill(transformed_vertices, color, pixels)

def parse_lines(lines):
    png_params = None
    positions = []
    colors = []
    triangles = []

    for line in lines:
        line = line.strip()
        if not line or line.split()[0] not in ["png", "position", "color", "drawArraysTriangles"]:
            continue
        
        parts = line.split()
        keyword = parts[0]

        if keyword == "png":
            width, height, filename = int(parts[1]), int(parts[2]), parts[3]
            png_params = (width, height, filename)
        elif keyword == "position":
            size = int(parts[1])
            positions = [(float(parts[i]), float(parts[i+1])) for i in range(2, len(parts), size)]
        elif keyword == "color":
            size = int(parts[1])
            colors = [(float(parts[i]), float(parts[i+1]), float(parts[i+2]), float(parts[i+3])) if size == 4 else (float(parts[i]), float(parts[i+1]), float(parts[i+2]), 1.0) for i in range(2, len(parts), size)]
        elif keyword == "drawArraysTriangles":
            start_index = int(parts[1])
            triangle_count = int(parts[2])
            for i in range(triangle_count):
                triangles.append((start_index + i * 3, start_index + i * 3 + 1, start_index + i * 3 + 2))

    return png_params, positions, colors, triangles

def create_png(png_params, positions, colors, triangles):
    width, height, filename = png_params
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    pixels = image.load()

    # for i in range(0, triangles, 3):
    #     triangle_positions = positions[i: i+3]
    #     triangle_colors = colors[i: i+3]
    #     draw_triangle(triangle_positions, triangle_colors, pixels)

    image.save(filename)

def main():
    if len(sys.argv) != 2:
        print("Usage: python program.py <input_file>")
        return

    input_file = sys.argv[1]
    lines = read_input_file(input_file)
    png_params, positions, colors, triangles = parse_lines(lines)
    
    if png_params:
        create_png(png_params, positions, colors, triangles)
        print(f"PNG file '{png_params[2]}' created successfully.")
    else:
        print("Invalid input file format.")

if __name__ == "__main__":
    main()
