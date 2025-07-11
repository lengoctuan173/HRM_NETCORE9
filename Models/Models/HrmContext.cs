﻿using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace Model.Models;

public partial class HrmContext : DbContext
{
    public HrmContext()
    {
    }

    public HrmContext(DbContextOptions<HrmContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Syccchatgroup> Syccchatgroups { get; set; }

    public virtual DbSet<Syccchatgroupmember> Syccchatgroupmembers { get; set; }

    public virtual DbSet<Syccchatmessage> Syccchatmessages { get; set; }

    public virtual DbSet<Sycuuser> Sycuusers { get; set; }

    public virtual DbSet<Sycuuserauth> Sycuuserauths { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Syccchatgroup>(entity =>
        {
            entity.HasKey(e => e.GroupChatId);

            entity.ToTable("SYCCCHATGROUP");

            entity.Property(e => e.GroupChatId).HasColumnName("GROUP_CHAT_ID");
            entity.Property(e => e.GroupChatName).HasColumnName("GROUP_CHAT_NAME");
        });

        modelBuilder.Entity<Syccchatgroupmember>(entity =>
        {
            entity.HasKey(e => e.GroupChatMemberId);

            entity.ToTable("SYCCCHATGROUPMEMBER");

            entity.Property(e => e.GroupChatMemberId).HasColumnName("GROUP_CHAT_MEMBER_ID");
            entity.Property(e => e.GroupChatId).HasColumnName("GROUP_CHAT_ID");
            entity.Property(e => e.UserId)
                .HasMaxLength(50)
                .HasColumnName("USER_ID");
        });

        modelBuilder.Entity<Syccchatmessage>(entity =>
        {
            entity.HasKey(e => e.ChatId);

            entity.ToTable("SYCCCHATMESSAGE");

            entity.Property(e => e.ChatId).HasColumnName("CHAT_ID");
            entity.Property(e => e.FilePath)
                .HasMaxLength(200)
                .HasColumnName("FILE_PATH");
            entity.Property(e => e.GroupChatId).HasColumnName("GROUP_CHAT_ID");
            entity.Property(e => e.Message).HasColumnName("MESSAGE");
            entity.Property(e => e.ReceiverId)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("RECEIVER_ID");
            entity.Property(e => e.SenderId)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("SENDER_ID");
            entity.Property(e => e.Timestamp)
                .HasColumnType("datetime")
                .HasColumnName("TIMESTAMP");
        });

        modelBuilder.Entity<Sycuuser>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__SYCUUSER__F3BEEBFF35979477");

            entity.ToTable("SYCUUSER");

            entity.Property(e => e.UserId)
                .HasMaxLength(64)
                .IsUnicode(false)
                .HasColumnName("USER_ID");
            entity.Property(e => e.CreateDt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("CREATE_DT");
            entity.Property(e => e.CreateUid)
                .HasMaxLength(8)
                .IsUnicode(false)
                .HasDefaultValueSql("(NULL)")
                .IsFixedLength()
                .HasColumnName("CREATE_UID");
            entity.Property(e => e.Deptcode)
                .HasMaxLength(200)
                .IsUnicode(false)
                .HasDefaultValueSql("(NULL)")
                .HasColumnName("DEPTCODE");
            entity.Property(e => e.EndId)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasDefaultValueSql("(NULL)")
                .HasColumnName("END_ID");
            entity.Property(e => e.GroupId)
                .HasMaxLength(200)
                .IsUnicode(false)
                .HasDefaultValueSql("(NULL)")
                .HasColumnName("GROUP_ID");
            entity.Property(e => e.ImagePath)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasDefaultValueSql("(NULL)")
                .HasColumnName("IMAGE_PATH");
            entity.Property(e => e.IpRestriction)
                .HasMaxLength(1)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("IP_RESTRICTION");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("IS_ACTIVE");
            entity.Property(e => e.Mobile)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasDefaultValueSql("(NULL)")
                .HasColumnName("MOBILE");
            entity.Property(e => e.Password)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasDefaultValueSql("(NULL)")
                .HasColumnName("PASSWORD");
            entity.Property(e => e.StaffId)
                .HasMaxLength(12)
                .IsUnicode(false)
                .HasDefaultValueSql("(NULL)")
                .HasColumnName("STAFF_ID");
            entity.Property(e => e.StartId)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasDefaultValueSql("(NULL)")
                .HasColumnName("START_ID");
            entity.Property(e => e.UpdateDt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("UPDATE_DT");
            entity.Property(e => e.UpdateUid)
                .HasMaxLength(8)
                .IsUnicode(false)
                .HasDefaultValueSql("(NULL)")
                .IsFixedLength()
                .HasColumnName("UPDATE_UID");
            entity.Property(e => e.UserEmail)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasDefaultValueSql("(NULL)")
                .HasColumnName("USER_EMAIL");
            entity.Property(e => e.UserName)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("USER_NAME");
        });

        modelBuilder.Entity<Sycuuserauth>(entity =>
        {
            entity.HasKey(e => e.UserAuthId);

            entity.ToTable("SYCUUSERAUTH");

            entity.Property(e => e.UserAuthId).HasColumnName("USER_AUTH_ID");
            entity.Property(e => e.CreateDt)
                .HasColumnType("datetime")
                .HasColumnName("CREATE_DT");
            entity.Property(e => e.IsActive).HasColumnName("IS_ACTIVE");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .HasColumnName("PASSWORD_HASH");
            entity.Property(e => e.Provider).HasColumnName("PROVIDER");
            entity.Property(e => e.ProviderImage)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("PROVIDER_IMAGE");
            entity.Property(e => e.ProviderKey)
                .HasMaxLength(200)
                .HasColumnName("PROVIDER_KEY");
            entity.Property(e => e.UserId)
                .HasMaxLength(64)
                .IsUnicode(false)
                .HasColumnName("USER_ID");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
