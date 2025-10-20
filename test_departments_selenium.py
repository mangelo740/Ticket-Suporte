# test_departments_selenium.py
"""
Script de teste automatizado para abrir a aplicação web, tentar cadastrar um departamento e capturar erros do console do navegador.
Necessário: pip install selenium
Baixe o ChromeDriver compatível com seu Chrome e coloque no PATH.
"""
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
import time

# Configurações do Selenium
chrome_options = Options()
chrome_options.add_argument('--headless')  # Rode sem interface gráfica
chrome_options.add_argument('--disable-gpu')
chrome_options.add_argument('--window-size=1200,800')
chrome_options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

# Caminho para o ChromeDriver (ajuste se necessário)
driver = webdriver.Chrome(options=chrome_options)

try:
    # Acesse a página de departamentos
    driver.get('http://127.0.0.1:3001/public/departments.html')
    time.sleep(2)

    # Preenche o formulário de cadastro
    driver.find_element(By.ID, 'departmentName').send_keys('TESTE SELENIUM')
    driver.find_element(By.ID, 'departmentCritico').send_keys('5')
    driver.find_element(By.ID, 'departmentAlto').send_keys('4')
    driver.find_element(By.ID, 'departmentMedia').send_keys('3')
    driver.find_element(By.ID, 'departmentBaixa').send_keys('2')
    driver.find_element(By.CSS_SELECTOR, 'button[type=submit]').click()
    time.sleep(2)

    # Captura logs do console do navegador
    logs = driver.get_log('browser')
    print('\n--- LOGS DO CONSOLE DO NAVEGADOR ---')
    for entry in logs:
        print(f"[{entry['level']}] {entry['message']}")

    # Verifica se aparece mensagem de sucesso na tela
    toast = driver.find_element(By.ID, 'toast').text
    print('\nMensagem do Toast:', toast)

except Exception as e:
    print('Erro no teste Selenium:', e)
finally:
    driver.quit()
