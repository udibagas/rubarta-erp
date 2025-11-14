export function toCurrency(
  number: number,
  currency: string = 'IDR',
  maximumFractionDigits: number = 0,
): string {
  return number.toLocaleString('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits,
  });
}

export function toDecimal(number: number, fraction: number = 0): string {
  return number.toLocaleString('id-ID', {
    style: 'decimal',
    maximumFractionDigits: fraction,
    minimumFractionDigits: fraction,
  });
}

function terbilangInteger(a: number): string {
  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  let kalimat = '';

  // 1 - 11
  if (a < 12) {
    kalimat = bilangan[a]!;
  }
  // 12 - 19
  else if (a < 20) {
    kalimat = bilangan[a - 10] + ' Belas';
  }
  // 20 - 99
  else if (a < 100) {
    const utama = a / 10;
    const depan = parseInt(String(utama).substr(0, 1));
    const belakang = a % 10;
    kalimat = bilangan[depan] + ' Puluh ' + bilangan[belakang];
  }
  // 100 - 199
  else if (a < 200) {
    kalimat = 'Seratus ' + terbilangInteger(a - 100);
  }
  // 200 - 999
  else if (a < 1000) {
    const utama = a / 100;
    const depan = parseInt(String(utama).substr(0, 1));
    const belakang = a % 100;
    kalimat = bilangan[depan] + ' Ratus ' + terbilangInteger(belakang);
  }
  // 1,000 - 1,999
  else if (a < 2000) {
    kalimat = 'Seribu ' + terbilangInteger(a - 1000);
  }
  // 2,000 - 9,999
  else if (a < 10000) {
    const utama = a / 1000;
    const depan = parseInt(String(utama).substr(0, 1));
    const belakang = a % 1000;
    kalimat = bilangan[depan] + ' Ribu ' + terbilangInteger(belakang);
  }
  // 10,000 - 99,999
  else if (a < 100000) {
    const utama = a / 100;
    const depan = parseInt(String(utama).substr(0, 2));
    const belakang = a % 1000;
    kalimat = terbilangInteger(depan) + ' Ribu ' + terbilangInteger(belakang);
  }
  // 100,000 - 999,999
  else if (a < 1000000) {
    const utama = a / 1000;
    const depan = parseInt(String(utama).substr(0, 3));
    const belakang = a % 1000;
    kalimat = terbilangInteger(depan) + ' Ribu ' + terbilangInteger(belakang);
  }
  // 1,000,000 - 	99,999,999
  else if (a < 100000000) {
    const utama = a / 1000000;
    const depan = parseInt(String(utama).substr(0, 4));
    const belakang = a % 1000000;
    kalimat = terbilangInteger(depan) + ' Juta ' + terbilangInteger(belakang);
  } else if (a < 1000000000) {
    const utama = a / 1000000;
    const depan = parseInt(String(utama).substr(0, 4));
    const belakang = a % 1000000;
    kalimat = terbilangInteger(depan) + ' Juta ' + terbilangInteger(belakang);
  } else if (a < 10000000000) {
    const utama = a / 1000000000;
    const depan = parseInt(String(utama).substr(0, 1));
    const belakang = a % 1000000000;
    kalimat = terbilangInteger(depan) + ' Milyar ' + terbilangInteger(belakang);
  } else if (a < 100000000000) {
    const utama = a / 1000000000;
    const depan = parseInt(String(utama).substr(0, 2));
    const belakang = a % 1000000000;
    kalimat = terbilangInteger(depan) + ' Milyar ' + terbilangInteger(belakang);
  } else if (a < 1000000000000) {
    const utama = a / 1000000000;
    const depan = parseInt(String(utama).substr(0, 3));
    const belakang = a % 1000000000;
    kalimat = terbilangInteger(depan) + ' Milyar ' + terbilangInteger(belakang);
  } else if (a < 10000000000000) {
    const utama = a / 10000000000;
    const depan = parseInt(String(utama).substr(0, 1));
    const belakang = a % 10000000000;
    kalimat =
      terbilangInteger(depan) + ' Triliun ' + terbilangInteger(belakang);
  } else if (a < 100000000000000) {
    const utama = a / 1000000000000;
    const depan = parseInt(String(utama).substr(0, 2));
    const belakang = a % 1000000000000;
    kalimat =
      terbilangInteger(depan) + ' Triliun ' + terbilangInteger(belakang);
  } else if (a < 1000000000000000) {
    const utama = a / 1000000000000;
    const depan = parseInt(String(utama).substr(0, 3));
    const belakang = a % 1000000000000;
    kalimat =
      terbilangInteger(depan) + ' Triliun ' + terbilangInteger(belakang);
  } else if (a < 10000000000000000) {
    const utama = a / 1000000000000000;
    const depan = parseInt(String(utama).substr(0, 1));
    const belakang = a % 1000000000000000;
    kalimat =
      terbilangInteger(depan) + ' Kuadriliun ' + terbilangInteger(belakang);
  }

  const pisah = kalimat.split(' ');
  const full = [];

  for (let i = 0; i < pisah.length; i++) {
    if (pisah[i] != '') {
      full.push(pisah[i]);
    }
  }

  return full.join(' ');
}

export function terbilang(a: number): string {
  a = Math.abs(a);

  // Split into integer and decimal parts
  const integerPart = Math.floor(a);
  const decimalPart = Math.round((a - integerPart) * 100); // Get 2 decimal places

  let result = '';

  // Handle integer part
  if (integerPart === 0) {
    result = 'Nol';
  } else {
    result = terbilangInteger(integerPart);
  }

  // Handle decimal part if it exists - read digit by digit
  if (decimalPart > 0) {
    const bilangan = [
      'Nol',
      'Satu',
      'Dua',
      'Tiga',
      'Empat',
      'Lima',
      'Enam',
      'Tujuh',
      'Delapan',
      'Sembilan',
    ];

    result += ' Koma';

    // Convert to string and pad with zero if needed (e.g., 5 becomes "05")
    const decimalString = decimalPart.toString().padStart(2, '0');

    // Read each digit separately
    for (let i = 0; i < decimalString.length; i++) {
      const digit = parseInt(decimalString[i]!);
      result += ' ' + bilangan[digit];
    }
  }

  return result;
}
