import os

base_path = r'C:\Users\serge\nbjh-math-team\nbjhmathteam'
problems_dir = os.path.join(base_path, 'aops_amc8_problems_all_years')
answers_dir = os.path.join(base_path, 'amc8_answers_all_years')

os.makedirs(problems_dir, exist_ok=True)
os.makedirs(answers_dir, exist_ok=True)

print(f"Created: {problems_dir}")
print(f"Created: {answers_dir}")

