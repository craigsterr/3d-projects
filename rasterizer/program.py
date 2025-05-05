from PIL import Image, ImageDraw
import sys
import math
import numpy as np

def read_input_file(file_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()
    return lines

def dda_algorithm_ps(a, b, d):
    a = np.array(a)
    b = np.array(b)

    if a[d] == b[d]:
        return [], []

    if a[d] > b[d]:
        a, b = b, a

    delta = b - a
    s = delta / delta[d]

    e = np.ceil(a[d]) - a[d]
    o = e * s

    p = a + o

    return p, s

def dda_algorithm(a, b, d):
    a = np.array(a)
    b = np.array(b)

    if a[d] == b[d]:
        return []

    if a[d] > b[d]:
        a, b = b, a

    delta = b - a
    s = delta / delta[d]

    e = np.ceil(a[d]) - a[d]
    o = e * s

    p = a + o

    points = []

    while p[d] < b[d]:
        points.append(p.copy())
        p += s

    return points

def interpolate_color(c1, c2, t):
    r1, g1, b1, a1 = c1
    r2, g2, b2, a2 = c2

    r_interp = r1 + (r2 - r1) * t
    g_interp = g1 + (g2 - g1) * t
    b_interp = b1 + (b2 - b1) * t
    a_interp = a1 + (a2 - a1) * t

    return (r_interp, g_interp, b_interp, a_interp)


def scanline_triangle(p, q, r, pixels, colors):
    vertices_with_colors = [(p, colors[0]), (q, colors[1]), (r, colors[2])]
    vertices_with_colors.sort(key=lambda vc: vc[0][1])

    vertices = [vc[0] for vc in vertices_with_colors]
    colors = [vc[1] for vc in vertices_with_colors]

    t = vertices[0]
    m = vertices[1]
    b = vertices[2]

    print(t, m, b)

    p_long, s_long = dda_algorithm_ps(t, b, 1)

    p, s = dda_algorithm_ps(t, m, 1)

    my = m[1]

    t_color, m_color, b_color = colors
    
    t_long_color = t_color
    b_long_color = b_color

    t_short_color = t_color
    m_short_color = m_color

    if len(p) != 0:
        while p[1] < my:
            points = dda_algorithm(p, p_long, 0)

            t_interp = 0

            if m[1] != t[1]:
                t_interp = (p[1] - t[1]) / (m[1] - t[1])
                
            color_start = interpolate_color(t_short_color, m_short_color, t_interp)

            t_interp_long = 0

            if b[1] != t[1]:
                t_interp_long = (p[1] - t[1]) / (b[1] - t[1])

            color_end = interpolate_color(t_long_color, b_long_color, t_interp_long)

            p += s
            p_long += s_long

            for point in points:
                if p_long[0] != p[0]:
                    x_interp = (point[0] - p[0]) / (p_long[0] - p[0])
                color = interpolate_color(color_start, color_end, x_interp)
                pixel_color = (int(255 * color[0]), int(255 * color[1]), int(255 * color[2]), int(255 * color[3]))
                pixels[point[0], point[1]] = pixel_color

    p, s = dda_algorithm_ps(m, b, 1)

    by = b[1]

    if len(p) != 0:
        while p[1] < by:
            points =  dda_algorithm(p, p_long, 0)

            t_interp = 0
            if b[1] != m[1]:
                t_interp = (p[1] - m[1]) / (b[1] - m[1])

            color_start = interpolate_color(m_short_color, b_color, t_interp)

            t_interp_long = 0
            if b[1] != t[1]:
                t_interp_long = (p[1] - t[1]) / (b[1] - t[1])

            color_end = interpolate_color(t_long_color, b_long_color, t_interp_long)

            p += s
            p_long += s_long
            for point in points:
                if p_long[0] != p[0]:
                    x_interp = (point[0] - p[0]) / (p_long[0] - p[0])
                color = interpolate_color(color_start, color_end, x_interp)
                pixel_color = (int(255 * color[0]), int(255 * color[1]), int(255 * color[2]), int(255 * color[3]))
                pixels[point[0], point[1]] = pixel_color

def plot_point(point):
    print(f"point: {point}")

def draw_triangle(image, pixels, triangle_positions, triangle_colors):
    # print("triangle_positions: ", triangle_positions)
    # print("triangle_positions[0]: ", triangle_positions[0])
    # print("triangle_positions[1]: ", triangle_positions[1])
    # print("triangle_positions[2]: ", triangle_positions[2])
    transformed_vertices = []
    for position in triangle_positions:
        x, y, z, w = position
        x = (x / w + 1) * image.width / 2
        y = (y / w + 1) * image.height / 2
        transformed_vertices.append((x, y))
        # print("transformed_vertices: ", transformed_vertices)
    

    avg_color = np.mean(triangle_colors, axis=0)
    color = (int(avg_color[0] * 255), int(avg_color[1] * 255), int(avg_color[2] * 255), int(avg_color[3] * 255) if len(avg_color) == 4 else 255)
    # print("transformed_vertices: ", transformed_vertices)
    scanline_triangle(transformed_vertices[0], transformed_vertices[1], transformed_vertices[2], pixels, triangle_colors)

def parse_lines(lines):
    png_params = None
    positions = []
    colors = []
    triangles = []

    for line in lines:
        line = line.strip()
        if not line or not line.split()[0] in ["png", "position", "color", "drawArraysTriangles"]:
            continue
        
        parts = line.split()
        keyword = parts[0]

        if keyword == "png":
            width, height, filename = int(parts[1]), int(parts[2]), parts[3]
            png_params = (width, height, filename)
        elif keyword == "position":
            if parts[1] == "2":
                positions = [(float(parts[i]), float(parts[i+1]),  float(0), float(1)) for i in range(2, len(parts), 2)]
            elif parts[1] == "3":
                positions = [(float(parts[i]), float(parts[i+1]), float(parts[i+2]), float(1)) for i in range(2, len(parts), 3)]
            elif parts[1] == "4":
                positions = [(float(parts[i]), float(parts[i+1]), float(parts[i+2]), float(parts[i+3])) for i in range(2, len(parts), 4)]
        elif keyword == "color":
            if parts[1] == "3":
                colors = [(float(parts[i]), float(parts[i+1]), float(parts[i+2]), float(1)) for i in range(2, len(parts), 3)]
            if parts[1] == "4":
                colors = [(float(parts[i]), float(parts[i+1]), float(parts[i+2]), float(parts[i+3])) for i in range(2, len(parts), 4)]
        elif keyword == "drawArraysTriangles":
            start_index = int(parts[1])
            triangle_count = int(parts[2])
            triangle = []
            for i in range(0, triangle_count, 3):
                triangles.append((i + start_index, i + start_index + 1, i + start_index + 2))
            # print(triangles)

    return png_params, positions, colors, triangles

def create_png(png_params, positions, colors, triangles):
    width, height, filename = png_params
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    pixels = image.load()

    for triangle in triangles:
        print(triangle)
        
        triangle_positions = positions[triangle[0]: triangle[2] + 1]
        triangle_colors = colors[triangle[0]: triangle[2] + 1]
        # print(triangle_positions)
        draw_triangle(image, pixels, triangle_positions, triangle_colors)

    image.save(filename)

def main():
    if len(sys.argv) != 2:
        print("Usage: python program.py <input_file>")
        return

    input_file = sys.argv[1]
    lines = read_input_file(input_file)
    png_params, positions, colors, draw_count = parse_lines(lines)
    
    if png_params:
        create_png(png_params, positions, colors, draw_count)
        print(f"PNG file '{png_params[2]}' created successfully.")
    else:
        print("Invalid input file format.")

if __name__ == "__main__":
    main()
