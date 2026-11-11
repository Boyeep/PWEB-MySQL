"""Responsive development QA and captures of the application's own pages."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

base='http://127.0.0.1:4190'
screens=Path('screenshots')
screens.mkdir(exist_ok=True)
checks=[]
errors=[]
with sync_playwright() as p:
    chrome=Path('C:/Program Files/Google/Chrome/Application/chrome.exe')
    browser=p.chromium.launch(headless=True,**({'executable_path':str(chrome)} if chrome.exists() else {}))
    context=browser.new_context(viewport={'width':1440,'height':1050},reduced_motion='reduce')
    page=context.new_page()
    page.on('pageerror',lambda error:errors.append(str(error)))
    for path,name in [('/','home-desktop.png'),('/rdbms','users-sql.png'),('/mongodb','users-mongo.png'),('/siswa/new','student-form.png')]:
        assert page.goto(base+path).status==200
        page.evaluate('document.fonts.ready')
        assert 'Koneksi database belum tersedia' not in page.locator('body').inner_text()
        page.screenshot(path=str(screens/name),full_page=True)
    page.goto(base+'/mongodb')
    page.locator('.person-name').first.click()
    assert page.get_by_role('heading',name='Dokumen JSON',exact=True).is_visible()
    page.screenshot(path=str(screens/'mongo-detail.png'),full_page=True)
    for width,height in [(375,812),(390,844),(768,1024),(812,375),(1024,768),(1440,1000)]:
        page.set_viewport_size({'width':width,'height':height})
        for path in ['/','/rdbms','/mongodb','/siswa/new','/perbandingan','/spesifikasi']:
            assert page.goto(base+path).status==200
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'Overflow {width} {path}'
            checks.append(f'No page overflow {width}x{height}: {path}')
    page.set_viewport_size({'width':390,'height':844})
    page.goto(base+'/')
    assert all(value.isdigit() for value in page.locator('.stat-grid strong').all_text_contents()), 'All database counters must load'
    page.screenshot(path=str(screens/'home-mobile.png'))
    toggle=page.locator('.menu-toggle')
    toggle.click()
    assert toggle.get_attribute('aria-expanded')=='true'
    page.keyboard.press('Escape')
    assert toggle.get_attribute('aria-expanded')=='false'
    checks.append('Mobile navigation opens and closes with Escape')
    no_js=browser.new_context(java_script_enabled=False)
    plain=no_js.new_page()
    for kind in ['rdbms','mongodb']:
        plain.goto(base+'/'+kind+'/new')
        plain.locator('#name').fill('QA Tanpa JavaScript')
        plain.locator('#email').fill('nojs@example.com')
        plain.locator('#age').fill('24')
        if kind=='mongodb':plain.locator('#profile').fill('{"city":"Surabaya","interests":["SQL"]}')
        plain.get_by_role('button',name='Simpan pengguna',exact=True).click()
        assert 'Data baru berhasil disimpan.' in plain.locator('body').inner_text()
        checks.append(kind+' form works without JavaScript')
    browser.close()
assert not errors,errors
report={'passed':len(checks),'checks':checks,'page_errors':errors}
Path('qa-layout.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({'passed':len(checks),'page_errors':errors},indent=2))
