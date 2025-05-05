from PIL import Image
import sys

def read_input_file(file_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()
    return lines

def parse_lines(lines):
    png_params = None
    positions = []
    colors = []
    draw_count = 0

    for line in lines:
        line = line.strip()
        print("line:", line)
        if not line or not line.split()[0] in ["png", "position", "color", "drawPixels"]:
            # print("not")
            continue
        
        parts = line.split()
        keyword = parts[0]

        # print(keyword)
        # print(parts)


        if keyword == "png":
            width, height, filename = int(parts[1]), int(parts[2]), parts[3]
            png_params = (width, height, filename)
        elif keyword == "position":
            positions = [(int(parts[i]), int(parts[i+1])) for i in range(2, len(parts), 2)]
        elif keyword == "color":
            colors = [(int(parts[i]), int(parts[i+1]), int(parts[i+2]), int(parts[i+3])) for i in range(2, len(parts), 4)]
        elif keyword == "drawPixels":
            draw_count = int(parts[1])

    return png_params, positions, colors, draw_count

def create_png(png_params, positions, colors, draw_count):
    width, height, filename = png_params
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    pixels = image.load()

    print(positions)

    for i in range(draw_count):
        
        x, y = positions[i]
        r, g, b, a = colors[i]
        pixels[x, y] = (r, g, b, a)

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
