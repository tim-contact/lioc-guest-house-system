<div class="doc-header">
    <div class="doc-header-serial">
        <div class="serial">Serial No: {{ $bdn?->bdn_number }}</div>
        <p>1) Original Customer</p>
        <p>2) Receiving Vessel</p>
        <p>3) Stock Section</p>
        <p>4) Customs Copy</p>
        <p>5) Operations Department</p>
        <h1 class="title">Bunker Delivery Note</h1>
    </div>

    <div class="doc-header-details">
        <p class="doc-header-name">Lanka IOC PLC</p>
        <p>Level 20, West Tower</p>
        <p>World Trade Center</p>
        <p>Colombo-01, Sri Lanka</p>
        <p>Tel: +91-11-2475720</p>
        <p>Fax: +91-11-2391490</p>
        <p>Email: bunker@lankaioc.com</p>
        <p>Website: http://www.lankaioc.com</p>
    </div>

    <div class="doc-header-logo">
        @if (file_exists(public_path('images/logo.png')))
            <img src="data:image/png;base64,{{ base64_encode(file_get_contents(public_path('images/logo.png'))) }}" alt="">
        @endif
    </div>
</div>