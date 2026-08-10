<div class="doc-header">
    <div class="doc-header-serial">
        <div class="serial">Serial No: {{ $bdn?->bdn_number }}</div>
        <p>placeholder</p>
        <p>placeholder</p>
    </div>

    <div class="doc-header-details">
        <p>placeholder</p>
        <p>placeholder</p>
        <p>placeholder</p>
        <p>placeholder</p>
    </div>

    <div class="doc-header-logo">
        @if (file_exists(public_path('images/logo.png')))
            <img src="data:image/png;base64,{{ base64_encode(file_get_contents(public_path('images/logo.png'))) }}" alt="">
        @endif
    </div>
</div>
