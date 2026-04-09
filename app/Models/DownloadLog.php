<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DownloadLog extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'project_id',
        'photo_id',
        'asset_type',
        'client_hash',
        'visitor_email',
        'ip_address',
        'user_agent',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function photo()
    {
        return $this->belongsTo(Photo::class);
    }
}
