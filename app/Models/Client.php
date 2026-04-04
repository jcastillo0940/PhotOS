<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'full_name', 'email', 'phone', 'is_recurring', 'notes',
    ];

    protected $casts = [
        'is_recurring' => 'boolean',
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function projects() { return $this->hasMany(Project::class); }
    public function invoices() { return $this->hasMany(Invoice::class); }
    public function payments() { return $this->hasMany(Payment::class); }
    public function statements() { return $this->hasMany(AccountStatement::class); }
}
