import os
import shutil
from playwright.sync_api import sync_playwright, Page
from bs4 import BeautifulSoup

# --- Configuration ---
START_YEAR = 1999
END_YEAR = 2025
BASE_URL = "https://artofproblemsolving.com/wiki/index.php?title={}_AMC_8_Problems"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def setup_output_directory(output_dir):
    """Creates a clean directory for storing screenshots."""
    if os.path.exists(output_dir):
        print(f"Removing existing directory: {output_dir}")
        shutil.rmtree(output_dir)
    os.makedirs(output_dir)
    print(f"Created directory: {output_dir}")

def extract_and_screenshot_problems(page: Page, output_dir: str):
    """
    Extracts the HTML for each problem individually, loads it into a clean page,
    and takes a screenshot.
    """
    print("Parsing page content...")
    html_content = page.content()
    soup = BeautifulSoup(html_content, 'html.parser')

    # Find the stylesheet URL from the original page to make screenshots look right
    stylesheet_link = soup.find('link', rel='stylesheet', href=True, attrs={'media': 'all'})
    stylesheet_url = ""
    if stylesheet_link:
        base_url = "https://artofproblemsolving.com"
        stylesheet_url = stylesheet_link['href']
        if stylesheet_url.startswith('/'):
            stylesheet_url = base_url + stylesheet_url
    
    print("Locating problem headers...")
    all_headers = soup.select("#mw-content-text h2")

    if not all_headers:
        print("\nError: Could not find any h2 headers on the AoPS page.")
        return

    print(f"Found {len(all_headers)} total h2 sections. Filtering for problems...")
    
    problem_count = 0
    for header in all_headers:
        headline_span = header.find('span', class_='mw-headline')
        # Process only the headers that are for problems
        if headline_span and 'Problem' in headline_span.get('id', ''):
            problem_count += 1
            print(f"  - Processing Problem {problem_count}...")

            problem_html_parts = [str(header)]
            # CORRECTED LOGIC: Collect siblings until the NEXT h2 tag is found
            for sibling in header.find_next_siblings():
                if sibling.name == 'h2':
                    break # Stop when we hit the next problem's header
                problem_html_parts.append(str(sibling))
            
            full_problem_html = "".join(problem_html_parts)

            # Create a self-contained HTML document for screenshotting
            html_template = f"""
            <!DOCTYPE html>
            <html lang=\"en\">
            <head>
                <meta charset=\"UTF-8\">
                <title>Problem {problem_count}</title>
                <link rel=\"stylesheet\" href=\"{stylesheet_url}\">
                <style>
                    body {{ background-color: #ffffff; padding: 15px; display: inline-block; }}
                    .mw-parser-output {{ margin: 0; }}
                </style>
            </head>
            <body>
                <div class=\"mw-parser-output\">
                    {full_problem_html}
                </div>
            </body>
            </html>
            """
            
            try:
                page.set_content(html_template, wait_until="networkidle")
                
                element_to_screenshot = page.locator('.mw-parser-output')
                
                screenshot_path = os.path.join(output_dir, f"problem_{problem_count}.png")
                element_to_screenshot.screenshot(path=screenshot_path)
                
            except Exception as e:
                print(f"    - Failed to screenshot Problem {problem_count}: {e}")

def main():
    """Main function to run the scraper."""
    print("Starting AoPS AMC 8 problem scraper...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 1080})

        for year in range(START_YEAR, END_YEAR + 1):
            current_url = BASE_URL.format(year)
            current_output_dir = os.path.join(SCRIPT_DIR, "aops_amc8_problems_all_years", f"aops_amc8_{year}_problems")
            
            print(f"\n--- Processing AMC 8 {year} ---")
            setup_output_directory(current_output_dir)

            try:
                print(f"Navigating to {current_url}...")
                page.goto(current_url, wait_until="domcontentloaded", timeout=60000)
                print("Page loaded successfully.")
                
                extract_and_screenshot_problems(page, current_output_dir)

            except Exception as e:
                print(f"\nAn error occurred for year {year}: {e}")
            
        print("\nClosing browser.")
        browser.close()

    print("\nScraping complete for all years!")

if __name__ == "__main__":
    main()
